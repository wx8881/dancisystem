from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db_config import get_oracle_conn

router = APIRouter()

class WordList(BaseModel):
    list_id: int
    list_name: str
    description: Optional[str] = None
    creator_id: Optional[int] = None
    create_time: Optional[str] = None
    is_public: Optional[bool] = None
    difficulty: Optional[str] = None
    word_count: Optional[int] = None

@router.get("/wordlists", response_model=List[WordList])
def get_wordlists(user_id: Optional[int] = None):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        if user_id:
            cursor.execute('SELECT list_id, list_name, description, creator_id, create_time, is_public, difficulty FROM WordList WHERE creator_id=:uid OR is_public=1', uid=user_id)
        else:
            cursor.execute('SELECT list_id, list_name, description, creator_id, create_time, is_public, difficulty FROM WordList')
        lists = []
        for row in cursor.fetchall():
            # 统计词表单词数
            cursor2 = conn.cursor()
            cursor2.execute('SELECT COUNT(*) FROM Word WHERE list_id=:lid', lid=row[0])
            word_count = cursor2.fetchone()[0]
            cursor2.close()
            lists.append(WordList(
                list_id=row[0],
                list_name=row[1],
                description=str(row[2]) if row[2] is not None else None,
                creator_id=row[3],
                create_time=row[4].strftime('%Y-%m-%d') if row[4] else None,
                is_public=bool(row[5]),
                difficulty=row[6],
                word_count=word_count
            ))
        return lists
    finally:
        cursor.close()
        conn.close()

@router.get("/wordlists/{list_id}", response_model=WordList)
def get_wordlist(list_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT list_id, list_name, description, creator_id, create_time, is_public, difficulty FROM WordList WHERE list_id=:lid', lid=list_id)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="词表不存在")
        cursor2 = conn.cursor()
        cursor2.execute('SELECT COUNT(*) FROM Word WHERE list_id=:lid', lid=row[0])
        word_count = cursor2.fetchone()[0]
        cursor2.close()
        return WordList(
            list_id=row[0],
            list_name=row[1],
            description=str(row[2]) if row[2] is not None else None,
            creator_id=row[3],
            create_time=row[4].strftime('%Y-%m-%d') if row[4] else None,
            is_public=bool(row[5]),
            difficulty=row[6],
            word_count=word_count
        )
    finally:
        cursor.close()
        conn.close()

class CreateWordListRequest(BaseModel):
    list_name: str
    description: Optional[str] = None
    creator_id: int
    is_public: bool
    difficulty: str

@router.post("/wordlists", response_model=WordList)
def create_wordlist(data: CreateWordListRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 获取新的list_id
        cursor.execute('SELECT NVL(MAX(list_id), 0) + 1 FROM WordList')
        list_id = cursor.fetchone()[0]
        
        cursor.execute('''
            INSERT INTO WordList (list_id, list_name, description, creator_id, create_time, is_public, difficulty)
            VALUES (:id, :name, :desc, :creator, SYSDATE, :public, :diff)
        ''', id=list_id, name=data.list_name, desc=data.description, creator=data.creator_id, 
             public=data.is_public, diff=data.difficulty)
        
        conn.commit()
        
        return get_wordlist(list_id)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.delete("/wordlists/{list_id}")
def delete_wordlist(list_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 先删除词表中的所有单词
        cursor.execute('DELETE FROM Word WHERE list_id = :lid', lid=list_id)
        # 然后删除词表
        cursor.execute('DELETE FROM WordList WHERE list_id = :lid', lid=list_id)
        conn.commit()
        return {"message": "词表删除成功"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

class UpdateWordListRequest(BaseModel):
    list_name: str
    description: Optional[str] = None
    is_public: bool
    difficulty: str

@router.put("/wordlists/{list_id}", response_model=WordList)
def update_wordlist(list_id: int, data: UpdateWordListRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 检查词表是否存在
        cursor.execute('SELECT COUNT(*) FROM WordList WHERE list_id = :1', (list_id,))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="词表不存在")
        
        # 更新词表信息
        cursor.execute('''
            UPDATE WordList 
            SET list_name = :1,
                description = :2,
                is_public = :3,
                difficulty = :4
            WHERE list_id = :5
        ''', (data.list_name, data.description, 1 if data.is_public else 0, data.difficulty, list_id))
        
        conn.commit()
        
        return get_wordlist(list_id)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close() 