from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_config import get_oracle_conn

router = APIRouter()

class FavoriteWord(BaseModel):
    fav_id: int
    user_id: int
    word_id: int
    fav_time: str

@router.get("/favorite", response_model=List[FavoriteWord])
def get_favorite(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT fav_id, user_id, word_id, fav_time FROM FavoriteWord WHERE user_id=:1 ORDER BY fav_time DESC', (user_id,))
        favorites = [
            FavoriteWord(
                fav_id=row[0],
                user_id=row[1],
                word_id=row[2],
                fav_time=row[3].strftime('%Y-%m-%dT%H:%M:%S')
            ) for row in cursor.fetchall()
        ]
        return favorites
    finally:
        cursor.close()
        conn.close()

class AddFavoriteRequest(BaseModel):
    user_id: int
    word_id: int

@router.post("/favorite/add")
def add_favorite(data: AddFavoriteRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 先检查单词是否存在
        cursor.execute('SELECT COUNT(*) FROM Word WHERE word_id = :word_id', word_id=data.word_id)
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="单词不存在")
            
        # 避免重复收藏
        cursor.execute('SELECT COUNT(*) FROM FavoriteWord WHERE user_id=:1 AND word_id=:2', (data.user_id, data.word_id))
        if cursor.fetchone()[0] > 0:
            return {"success": False, "message": "已收藏"}
            
        cursor.execute('INSERT INTO FavoriteWord (user_id, word_id) VALUES (:1, :2)', (data.user_id, data.word_id))
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

class RemoveFavoriteRequest(BaseModel):
    user_id: int
    word_id: int

@router.post("/favorite/remove")
def remove_favorite(data: RemoveFavoriteRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM FavoriteWord WHERE user_id=:1 AND word_id=:2', (data.user_id, data.word_id))
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close()

@router.delete("/favorite/{fav_id}")
def delete_favorite(fav_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('DELETE FROM FavoriteWord WHERE fav_id = :fav_id', fav_id=fav_id)
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close() 