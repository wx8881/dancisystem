from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from db_config import get_oracle_conn

router = APIRouter()

class SearchResult(BaseModel):
    words: List[Dict[str, Any]]
    lists: List[Dict[str, Any]]
    users: List[Dict[str, Any]]

@router.get("/search")
def global_search(query: str = Query(..., min_length=1), type: str = Query("all")):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        result = {"words": [], "lists": [], "users": []}
        
        if type in ["words", "all"]:
            cursor.execute('SELECT word_id, word, list_id FROM Word WHERE LOWER(word) LIKE LOWER(:query)', query=f'%{query}%')
            for word_id, word, list_id in cursor.fetchall():
                cursor.execute('SELECT translation, word_type FROM WordTranslation WHERE word_id = :word_id ORDER BY word_type', word_id=word_id)
                translations = [{"translation": t, "type": ty} for t, ty in cursor.fetchall()]
                cursor.execute('SELECT phrase, translation FROM WordPhrase WHERE word_id = :word_id', word_id=word_id)
                phrases = [{"phrase": str(p), "translation": str(tr)} for p, tr in cursor.fetchall()]
                result["words"].append({
                    "word_id": word_id,
                    "word": word,
                    "translations": translations,
                    "phrases": phrases,
                    "list_id": list_id
                })
        
        if type in ["lists", "all"]:
            cursor.execute("SELECT l.list_id, l.list_name, l.description, l.creator_id, TO_CHAR(l.create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time, l.is_public, (SELECT COUNT(*) FROM Word w WHERE w.list_id = l.list_id) as word_count FROM WordList l WHERE LOWER(l.list_name) LIKE LOWER(:query) OR LOWER(l.description) LIKE LOWER(:query)", query=f'%{query}%')
            for row in cursor.fetchall():
                result["lists"].append({
                    "list_id": row[0],
                    "list_name": row[1],
                    "description": row[2],
                    "creator_id": row[3],
                    "create_time": row[4],
                    "is_public": row[5],
                    "word_count": row[6]
                })
        
        if type in ["users", "all"]:
            cursor.execute("SELECT user_id, username, role, email, TO_CHAR(create_time, 'YYYY-MM-DD HH24:MI:SS') as create_time FROM \"User\" WHERE LOWER(username) LIKE LOWER(:query) OR LOWER(email) LIKE LOWER(:query)", query=f'%{query}%')
            for row in cursor.fetchall():
                result["users"].append({
                    "user_id": row[0],
                    "username": row[1],
                    "role": row[2],
                    "email": row[3],
                    "create_time": row[4]
                })
        
        return result
    finally:
        cursor.close()
        conn.close()

@router.get("/export")
def export_data(user_id: int, type: str = Query("all")):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        result = {"words": [], "progress": []}
        
        if type in ["words", "all"]:
            # 获取单词列表
            cursor.execute('''
                WITH word_data AS (
                    SELECT DISTINCT w.word_id, w.word, w.list_id
                    FROM Word w
                    JOIN StudyLog s ON w.word_id = s.word_id
                    WHERE s.user_id = :user_id
                )
                SELECT * FROM word_data
            ''', user_id=user_id)
            
            words = cursor.fetchall()
            
            # 对每个单词获取翻译和短语
            for word_id, word, list_id in words:
                # 获取翻译
                cursor.execute('''
                    SELECT translation, word_type
                    FROM WordTranslation
                    WHERE word_id = :word_id
                    ORDER BY word_type
                ''', word_id=word_id)
                
                translations = []
                for trans, word_type in cursor.fetchall():
                    translations.append({"translation": trans, "type": word_type})
                
                # 获取短语
                cursor.execute('''
                    SELECT phrase, translation
                    FROM WordPhrase
                    WHERE word_id = :word_id
                ''', word_id=word_id)
                
                phrases = []
                for phrase, trans in cursor.fetchall():
                    phrases.append({"phrase": str(phrase), "translation": str(trans)})
                
                result["words"].append({
                    "word_id": word_id,
                    "word": word,
                    "translations": translations,
                    "phrases": phrases,
                    "list_id": list_id
                })
        
        if type in ["progress", "all"]:
            cursor.execute('''
                SELECT w.word, 
                       COUNT(*) as study_count,
                       MAX(s.study_time) as last_study_time,
                       AVG(CASE WHEN s.status = 'known' THEN 1 ELSE 0 END) as accuracy
                FROM StudyLog s
                JOIN Word w ON s.word_id = w.word_id
                WHERE s.user_id = :user_id
                GROUP BY w.word
            ''', user_id=user_id)
            
            for row in cursor.fetchall():
                result["progress"].append({
                    "word": row[0],
                    "study_count": row[1],
                    "last_study_time": row[2].strftime('%Y-%m-%d %H:%M:%S') if row[2] else None,
                    "accuracy": float(row[3]) if row[3] is not None else 0
                })
        
        return result
    finally:
        cursor.close()
        conn.close() 