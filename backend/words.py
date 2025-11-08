from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from db_config import get_oracle_conn

router = APIRouter()

class Translation(BaseModel):
    translation: str
    type: str

class Phrase(BaseModel):
    phrase: str
    translation: str

class Word(BaseModel):
    word: str
    translations: List[Translation]
    phrases: List[Phrase]
    list_id: int

@router.post("/words")
def create_word(word: Word):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 用序列获取新的word_id，假设有Word_SEQ
        cursor.execute('SELECT Word_SEQ.NEXTVAL FROM dual')
        word_id = cursor.fetchone()[0]
        
        # 插入单词
        cursor.execute('''
            INSERT INTO Word (word_id, word, list_id)
            VALUES (:word_id, :word, :list_id)
        ''', word_id=word_id, word=word.word, list_id=word.list_id)
        
        # 插入翻译
        for trans in word.translations:
            cursor.execute('''
                INSERT INTO WordTranslation (word_id, translation, word_type)
                VALUES (:word_id, :translation, :word_type)
            ''', word_id=word_id, translation=trans.translation, word_type=trans.type)
        
        # 插入短语
        for phrase in word.phrases:
            cursor.execute('''
                INSERT INTO WordPhrase (word_id, phrase, translation)
                VALUES (:word_id, :phrase, :translation)
            ''', word_id=word_id, phrase=phrase.phrase, translation=phrase.translation)
        
        conn.commit()
        
        # 返回创建的单词
        return get_word(word_id)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.get("/words")
def get_words(list_id: Optional[int] = None, limit: Optional[int] = None):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        query = '''
            SELECT w.word_id, w.word, w.list_id
            FROM Word w
        '''
        params = {}
        if list_id:
            query += ' WHERE w.list_id = :list_id'
            params['list_id'] = list_id
        if limit:
            query += ' FETCH FIRST :limit ROWS ONLY'
            params['limit'] = limit
        cursor.execute(query, params)
        rows = cursor.fetchall()
        words = []
        for row in rows:
            word_id, word, list_id = row
            # 获取翻译
            cursor.execute('''SELECT translation, word_type FROM WordTranslation WHERE word_id = :word_id ORDER BY word_type''', word_id=word_id)
            translations = [{"translation": str(t) if t is not None else '', "type": ty} for t, ty in cursor.fetchall()]
            # 获取短语
            cursor.execute('''SELECT phrase, translation FROM WordPhrase WHERE word_id = :word_id''', word_id=word_id)
            phrases = [{"phrase": str(p) if p is not None else '', "translation": str(tr) if tr is not None else ''} for p, tr in cursor.fetchall()]
            words.append({
                "word_id": word_id,
                "word": word,
                "translations": translations,
                "phrases": phrases,
                "list_id": list_id
            })
        return words
    finally:
        cursor.close()
        conn.close()

@router.get("/words/{word_id}")
def get_word(word_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('''SELECT word_id, word, list_id FROM Word WHERE word_id = :word_id''', word_id=word_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Word not found")
        word_id, word, list_id = row
        cursor.execute('''SELECT translation, word_type FROM WordTranslation WHERE word_id = :word_id ORDER BY word_type''', word_id=word_id)
        translations = [{"translation": str(t) if t is not None else '', "type": ty} for t, ty in cursor.fetchall()]
        cursor.execute('''SELECT phrase, translation FROM WordPhrase WHERE word_id = :word_id''', word_id=word_id)
        phrases = [{"phrase": str(p) if p is not None else '', "translation": str(tr) if tr is not None else ''} for p, tr in cursor.fetchall()]
        return {
            "word_id": word_id,
            "word": word,
            "translations": translations,
            "phrases": phrases,
            "list_id": list_id
        }
    finally:
        cursor.close()
        conn.close()

@router.delete("/words/{word_id}")
def delete_word(word_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 删除相关的翻译和短语
        cursor.execute('DELETE FROM WordTranslation WHERE word_id = :word_id', word_id=word_id)
        cursor.execute('DELETE FROM WordPhrase WHERE word_id = :word_id', word_id=word_id)
        
        # 删除单词
        cursor.execute('DELETE FROM Word WHERE word_id = :word_id', word_id=word_id)
        
        conn.commit()
        return {"message": "Word deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()