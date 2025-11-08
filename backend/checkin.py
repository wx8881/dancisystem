from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db_config import get_oracle_conn
import datetime

router = APIRouter()

class CheckInLog(BaseModel):
    checkin_id: int
    user_id: int
    checkin_date: str
    word_count: int
    study_duration: int
    accuracy_rate: float

@router.get("/checkin/logs", response_model=List[CheckInLog])
def get_checkin_logs(user_id: int, limit: int = 7):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = f'SELECT checkin_id, user_id, checkin_date, word_count, study_duration, accuracy_rate FROM CheckInLog WHERE user_id=:1 ORDER BY checkin_date DESC FETCH FIRST {int(limit)} ROWS ONLY'
        cursor.execute(sql, (user_id,))
        logs = [
            CheckInLog(
                checkin_id=row[0],
                user_id=row[1],
                checkin_date=row[2].strftime('%Y-%m-%d'),
                word_count=row[3],
                study_duration=row[4],
                accuracy_rate=float(row[5])
            ) for row in cursor.fetchall()
        ]
        return logs
    finally:
        cursor.close()
        conn.close()

class CheckInRequest(BaseModel):
    user_id: int
    word_count: int
    study_duration: int
    accuracy_rate: float

@router.post("/checkin/today", response_model=CheckInLog)
def checkin_today(data: CheckInRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 检查今天是否已打卡
        cursor.execute('SELECT checkin_id, user_id, checkin_date, word_count, study_duration, accuracy_rate FROM CheckInLog WHERE user_id=:1 AND checkin_date=TRUNC(SYSDATE)', (data.user_id,))
        row = cursor.fetchone()
        if row:
            return CheckInLog(
                checkin_id=row[0], user_id=row[1], checkin_date=row[2].strftime('%Y-%m-%d'),
                word_count=row[3], study_duration=row[4], accuracy_rate=float(row[5])
            )
        # 插入今日打卡
        checkin_id_var = cursor.var(int)
        cursor.execute(
            'INSERT INTO CheckInLog (user_id, checkin_date, word_count, study_duration, accuracy_rate) VALUES (:1, TRUNC(SYSDATE), :2, :3, :4) RETURNING checkin_id INTO :5',
            (data.user_id, data.word_count, data.study_duration, data.accuracy_rate, checkin_id_var)
        )
        conn.commit()
        return CheckInLog(
            checkin_id=checkin_id_var.getvalue()[0] if isinstance(checkin_id_var.getvalue(), list) else checkin_id_var.getvalue(),
            user_id=data.user_id,
            checkin_date=datetime.date.today().strftime('%Y-%m-%d'),
            word_count=data.word_count,
            study_duration=data.study_duration,
            accuracy_rate=data.accuracy_rate
        )
    finally:
        cursor.close()
        conn.close()

class CheckInStats(BaseModel):
    currentStreak: int
    longestStreak: int
    totalCheckIns: int
    thisMonthCheckIns: int

@router.get("/checkin/stats", response_model=CheckInStats)
def get_checkin_stats(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 连续打卡天数
        cursor.execute('''
            SELECT MAX(streak) FROM (
                SELECT COUNT(*) AS streak
                FROM (
                    SELECT checkin_date, ROW_NUMBER() OVER (ORDER BY checkin_date DESC) rn
                    FROM CheckInLog WHERE user_id=:1
                )
                GROUP BY checkin_date - rn
            )
        ''', (user_id,))
        current_streak = cursor.fetchone()[0] or 0
        # 最长连续打卡天数
        longest_streak = current_streak  # 可根据实际需求调整
        # 总打卡天数
        cursor.execute('SELECT COUNT(*) FROM CheckInLog WHERE user_id=:1', (user_id,))
        total_checkins = cursor.fetchone()[0]
        # 本月打卡天数
        cursor.execute("SELECT COUNT(*) FROM CheckInLog WHERE user_id=:1 AND TO_CHAR(checkin_date, 'YYYY-MM') = TO_CHAR(SYSDATE, 'YYYY-MM')", (user_id,))
        this_month_checkins = cursor.fetchone()[0]
        return CheckInStats(
            currentStreak=current_streak,
            longestStreak=longest_streak,
            totalCheckIns=total_checkins,
            thisMonthCheckIns=this_month_checkins
        )
    finally:
        cursor.close()
        conn.close() 