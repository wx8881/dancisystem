from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from db_config import get_oracle_conn

router = APIRouter()

class StudyLog(BaseModel):
    log_id: int
    user_id: int
    word_id: int
    study_time: str
    status: str

class StudyLogCreate(BaseModel):
    user_id: int
    word_id: int
    status: str

@router.get("/studylog", response_model=List[StudyLog])
def get_studylog(user_id: int, limit: int = 10):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = f'SELECT log_id, user_id, word_id, study_time, status FROM StudyLog WHERE user_id=:1 ORDER BY study_time DESC FETCH FIRST {int(limit)} ROWS ONLY'
        cursor.execute(sql, (user_id,))
        logs = [
            StudyLog(
                log_id=row[0],
                user_id=row[1],
                word_id=row[2],
                study_time=row[3].strftime('%Y-%m-%dT%H:%M:%S'),
                status=row[4]
            )
            for row in cursor.fetchall()
        ]
        return logs
    finally:
        cursor.close()
        conn.close()

@router.post("/study/log")
def create_studylog(log: StudyLogCreate):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        log_id_var = cursor.var(int)
        cursor.execute(
            'INSERT INTO StudyLog (user_id, word_id, study_time, status) VALUES (:1, :2, SYSDATE, :3) RETURNING log_id INTO :4',
            (log.user_id, log.word_id, log.status, log_id_var)
        )
        conn.commit()
        return {"message": "Study log created successfully", "log_id": log_id_var.getvalue()[0]}
    finally:
        cursor.close()
        conn.close()