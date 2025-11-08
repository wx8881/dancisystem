from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_config import get_oracle_conn

router = APIRouter()

class Word(BaseModel):
    word_id: int
    word: str
    list_id: int
    translations: List[dict]
    phrases: List[dict]
    difficulty: str

class WrongWord(BaseModel):
    id: int
    user_id: int
    word_id: int
    wrong_count: int
    last_wrong_time: str
    error_type: str
    user_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    word: Optional[Word] = None

@router.get("/wrongwords", response_model=List[WrongWord])
def get_wrongwords(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 获取错题记录并包含单词详情
        cursor.execute('''
            SELECT 
                w.id, w.user_id, w.word_id, w.wrong_count, w.last_wrong_time, 
                w.error_type, w.user_answer, w.correct_answer,
                word.word, word.list_id
            FROM WrongWord w
            JOIN Word word ON w.word_id = word.word_id
            WHERE w.user_id = :1
            ORDER BY w.last_wrong_time DESC
        ''', (user_id,))
        
        wrongs = []
        for row in cursor.fetchall():
            # 获取单词的翻译列表
            cursor.execute('''
                SELECT translation, word_type 
                FROM WordTranslation 
                WHERE word_id = :1
            ''', (row[2],))
            translations = [
                {"translation": str(t[0]) if t[0] is not None else '', "type": str(t[1]) if t[1] is not None else ''}
                for t in cursor.fetchall()
            ]
            
            # 获取单词的短语列表
            cursor.execute('''
                SELECT phrase, translation 
                FROM WordPhrase 
                WHERE word_id = :1
            ''', (row[2],))
            phrases = [
                {"phrase": str(p[0]) if p[0] is not None else '', "translation": str(p[1]) if p[1] is not None else ''}
                for p in cursor.fetchall()
            ]
            
            # 获取词表难度
            cursor.execute('''
                SELECT difficulty 
                FROM WordList 
                WHERE list_id = :1
            ''', (row[9],))
            difficulty_row = cursor.fetchone()
            difficulty = str(difficulty_row[0]) if difficulty_row and difficulty_row[0] is not None else ''
            
            wrongs.append({
                "id": row[0],
                "user_id": row[1],
                "word_id": row[2],
                "wrong_count": row[3],
                "last_wrong_time": row[4].strftime('%Y-%m-%dT%H:%M:%S'),
                "error_type": str(row[5]) if row[5] is not None else '',
                "user_answer": str(row[6]) if row[6] is not None else None,
                "correct_answer": str(row[7]) if row[7] is not None else None,
                "word": {
                    "word_id": row[2],
                    "word": str(row[8]) if row[8] is not None else '',
                    "list_id": row[9],
                    "translations": translations,
                    "phrases": phrases,
                    "difficulty": difficulty
                }
            })
        return wrongs
    finally:
        cursor.close()
        conn.close()

class AddWrongWordRequest(BaseModel):
    user_id: int
    word_id: int
    user_answer: Optional[str] = None
    error_type: Optional[str] = "含义理解"

@router.post("/wrongwords/add")
def add_wrongword(data: AddWrongWordRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 先检查单词是否存在
        cursor.execute('SELECT COUNT(*) FROM Word WHERE word_id = :word_id', word_id=data.word_id)
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="单词不存在")
            
        cursor.execute(
            'INSERT INTO WrongWord (user_id, word_id, wrong_count, error_type, user_answer) VALUES (:user_id, :word_id, 1, :error_type, :user_answer)',
            user_id=data.user_id, word_id=data.word_id, error_type=data.error_type, user_answer=data.user_answer
        )
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.delete("/wrongwords/{wrongword_id}")
def delete_wrongword(wrongword_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM WrongWord WHERE id=:1', (wrongword_id,))
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close()

class MarkMasteredRequest(BaseModel):
    user_id: int
    word_id: int

@router.post("/wrongwords/mastered")
def mark_word_mastered(data: MarkMasteredRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 删除错词本中的该单词
        cursor.execute('DELETE FROM WrongWord WHERE user_id=:1 AND word_id=:2', (data.user_id, data.word_id))
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close() 