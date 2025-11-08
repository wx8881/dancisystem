import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_config import get_oracle_conn

router = APIRouter()

class ReviewSchedule(BaseModel):
    schedule_id: int
    user_id: int
    word_id: int
    review_date: str
    repeat_count: int
    memory_strength: Optional[float] = None

@router.get("/review", response_model=List[ReviewSchedule])
def get_review(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT schedule_id, user_id, word_id, review_date, repeat_count, memory_strength FROM ReviewSchedule WHERE user_id=:1 ORDER BY review_date', (user_id,))
        reviews = [
            ReviewSchedule(
                schedule_id=row[0],
                user_id=row[1],
                word_id=row[2],
                review_date=row[3].strftime('%Y-%m-%dT%H:%M:%S'),
                repeat_count=row[4],
                memory_strength=float(row[5]) if row[5] is not None else None
            ) for row in cursor.fetchall()
        ]
        return reviews
    finally:
        cursor.close()
        conn.close()

class UpdateReviewRequest(BaseModel):
    review_date: Optional[str] = None
    repeat_count: Optional[int] = None
    memory_strength: Optional[float] = None

@router.put("/review/{schedule_id}")
def update_review(schedule_id: int, data: UpdateReviewRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sets = []
        params = {}
        if data.review_date:
            sets.append('review_date=:review_date')
            params['review_date'] = data.review_date
        if data.repeat_count is not None:
            sets.append('repeat_count=:repeat_count')
            params['repeat_count'] = data.repeat_count
        if data.memory_strength is not None:
            sets.append('memory_strength=:memory_strength')
            params['memory_strength'] = data.memory_strength
        if not sets:
            raise HTTPException(status_code=400, detail="无更新内容")
        sql = 'UPDATE ReviewSchedule SET ' + ', '.join(sets) + ' WHERE schedule_id=:schedule_id'
        params['schedule_id'] = schedule_id
        cursor.execute(sql, params)
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close()

class CreateReviewRequest(BaseModel):
    user_id: int
    word_id: int
    review_date: str
    repeat_count: Optional[int] = 0
    memory_strength: Optional[float] = 0.5

@router.post("/review/create", response_model=ReviewSchedule)
def create_review(data: CreateReviewRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        schedule_id_var = cursor.var(int)
        # 将 review_date 字符串转为 datetime
        review_date_dt = datetime.datetime.strptime(data.review_date, "%Y-%m-%dT%H:%M:%S")
        cursor.execute(
            'INSERT INTO ReviewSchedule (user_id, word_id, review_date, repeat_count, memory_strength) VALUES (:user_id, :word_id, :review_date, :repeat_count, :memory_strength) RETURNING schedule_id INTO :schedule_id',
            user_id=data.user_id, word_id=data.word_id, review_date=review_date_dt, repeat_count=data.repeat_count, memory_strength=data.memory_strength, schedule_id=schedule_id_var
        )
        conn.commit()
        return ReviewSchedule(
            schedule_id=schedule_id_var.getvalue()[0] if isinstance(schedule_id_var.getvalue(), list) else schedule_id_var.getvalue(),
            user_id=data.user_id,
            word_id=data.word_id,
            review_date=data.review_date,
            repeat_count=data.repeat_count,
            memory_strength=data.memory_strength
        )
    finally:
        cursor.close()
        conn.close()
