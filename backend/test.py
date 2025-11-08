from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from db_config import get_oracle_conn

# 导入单词相关的类型
class WordTranslation(BaseModel):
    translation: str
    word_type: str

    @classmethod
    def from_db_row(cls, row):
        # 处理 LOB 类型
        translation = row[0].read() if hasattr(row[0], 'read') else str(row[0])
        word_type = row[1].read() if hasattr(row[1], 'read') else str(row[1])
        return cls(translation=translation, word_type=word_type)

class WordPhrase(BaseModel):
    phrase: str
    translation: str

    @classmethod
    def from_db_row(cls, row):
        # 处理 LOB 类型
        phrase = row[0].read() if hasattr(row[0], 'read') else str(row[0])
        translation = row[1].read() if hasattr(row[1], 'read') else str(row[1])
        return cls(phrase=phrase, translation=translation)

router = APIRouter()

class TestQuestion(BaseModel):
    word_id: int
    word: Optional[str] = None
    translations: Optional[List[WordTranslation]] = None
    phrases: Optional[List[WordPhrase]] = None
    question: Optional[str] = None
    correct_answer: Optional[str] = None

class TestResult(BaseModel):
    user_id: int
    score: float
    total_questions: int
    correct_answers: int
    test_date: datetime
    test_type: str

class SubmitTestRequest(BaseModel):
    user_id: int
    questions: List[TestQuestion]
    answers: List[str]
    score: float
    total_questions: int
    correct_answers: int
    test_type: str

@router.post("/tests/results", response_model=TestResult)
def submit_test_result(test: SubmitTestRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 记录错误的答案
        for i, (question, answer) in enumerate(zip(test.questions, test.answers)):
            # 获取正确答案
            if question.correct_answer:
                correct_answer = question.correct_answer
            else:
                cursor.execute('''
                    SELECT translation 
                    FROM WordTranslation 
                    WHERE word_id = :word_id AND ROWNUM = 1
                ''', word_id=question.word_id)
                correct_answer = cursor.fetchone()[0]
            
            # 如果答案错误，添加到错题本
            if answer != correct_answer:
                # 先检查是否已经存在该单词的错题记录（不区分error_type）
                cursor.execute('''
                    SELECT id FROM WrongWord 
                    WHERE user_id = :user_id 
                    AND word_id = :word_id
                ''', 
                user_id=test.user_id,
                word_id=question.word_id
                )
                
                existing_record = cursor.fetchone()
                
                if existing_record:
                    # 如果存在，更新记录
                    cursor.execute('''
                        UPDATE WrongWord 
                        SET wrong_count = wrong_count + 1,
                            last_wrong_time = SYSDATE,
                            user_answer = :user_answer,
                            correct_answer = :correct_answer,
                            error_type = :error_type
                        WHERE id = :id
                    ''',
                    id=existing_record[0],
                    user_answer=answer,
                    correct_answer=correct_answer,
                    error_type=test.test_type
                    )
                else:
                    # 如果不存在，插入新记录
                    cursor.execute('''
                        INSERT INTO WrongWord 
                        (user_id, word_id, wrong_count, last_wrong_time, error_type, user_answer, correct_answer)
                        VALUES (:user_id, :word_id, 1, SYSDATE, :error_type, :user_answer, :correct_answer)
                    ''',
                    user_id=test.user_id,
                    word_id=question.word_id,
                    error_type=test.test_type,
                    user_answer=answer,
                    correct_answer=correct_answer
                    )
            
            # 记录学习状态
            status = 'known' if answer == correct_answer else 'unknown'
            cursor.execute('''
                INSERT INTO StudyLog (user_id, word_id, status)
                VALUES (:user_id, :word_id, :status)
            ''',
            user_id=test.user_id,
            word_id=question.word_id,
            status=status
            )
        
        conn.commit()
        
        # 返回测试结果
        return TestResult(
            user_id=test.user_id,
            score=test.score,
            total_questions=test.total_questions,
            correct_answers=test.correct_answers,
            test_date=datetime.now(),
            test_type=test.test_type
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/tests/history", response_model=List[TestResult])
def get_test_history(user_id: int, limit: Optional[int] = None):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 从StudyLog表中获取学习记录，按日期分组
        sql = '''
            WITH grouped_logs AS (
                SELECT 
                    s.user_id,
                    TRUNC(s.study_time) as study_date,
                    COUNT(DISTINCT s.word_id) as total_questions,
                    SUM(CASE WHEN s.status = 'known' THEN 1 ELSE 0 END) as correct_answers
                FROM StudyLog s
                WHERE s.user_id = :user_id
                GROUP BY s.user_id, TRUNC(s.study_time)
            )
            SELECT 
                user_id,
                total_questions,
                correct_answers,
                TO_CHAR(study_date, 'YYYY-MM-DD HH24:MI:SS') as test_date,
                'vocabulary' as test_type
            FROM grouped_logs
            ORDER BY study_date DESC
        '''
        if limit:
            sql += f' FETCH FIRST {int(limit)} ROWS ONLY'
        
        cursor.execute(sql, user_id=user_id)
        return [TestResult(
            user_id=r[0],
            score=float(r[2]) / float(r[1]) * 100 if r[1] > 0 else 0,
            total_questions=r[1],
            correct_answers=r[2],
            test_date=datetime.strptime(r[3], '%Y-%m-%d %H:%M:%S'),
            test_type=r[4]
        ) for r in cursor.fetchall()]
    finally:
        cursor.close()
        conn.close()

@router.get("/test/questions", response_model=List[TestQuestion])
def get_test_questions(count: int = 5):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 随机选择单词
        cursor.execute('''
            SELECT word_id, word 
            FROM Word 
            ORDER BY DBMS_RANDOM.VALUE 
            FETCH FIRST :1 ROWS ONLY
        ''', (count,))
        words = cursor.fetchall()

        questions = []
        for word_id, word in words:
            # 获取翻译
            cursor.execute('''
                SELECT translation, word_type 
                FROM WordTranslation 
                WHERE word_id = :1
            ''', (word_id,))
            translations = [
                WordTranslation.from_db_row(row)
                for row in cursor.fetchall()
            ]

            # 获取短语
            cursor.execute('''
                SELECT phrase, translation 
                FROM WordPhrase 
                WHERE word_id = :1
            ''', (word_id,))
            phrases = [
                WordPhrase.from_db_row(row)
                for row in cursor.fetchall()
            ]

            questions.append(TestQuestion(
                word_id=word_id,
                word=word,
                translations=translations,
                phrases=phrases
            ))

        return questions
    finally:
        cursor.close()
        conn.close()