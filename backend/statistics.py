from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from db_config import get_oracle_conn
import datetime

router = APIRouter()

class DailyStats(BaseModel):
    date: str
    words_studied: int
    accuracy_rate: float
    time_spent: int  # in minutes

class WordMasteryStats(BaseModel):
    word: str
    mastery_level: str
    last_review_date: Optional[str]
    review_count: int
    accuracy_rate: float

class WeeklyProgress(BaseModel):
    week_start: str
    words_studied: int
    average_accuracy: float
    study_time: int  # in minutes
    streak_days: int

class CategoryStats(BaseModel):
    category: str
    word_count: int
    mastered_count: int
    learning_count: int
    not_started_count: int

@router.get("/statistics/daily/{user_id}", response_model=List[DailyStats])
def get_daily_statistics(user_id: int, days: int = 7):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = """
        SELECT 
            TRUNC(study_time) as study_date,
            COUNT(DISTINCT word_id) as words_studied,
            AVG(CASE WHEN status = 'correct' THEN 1 ELSE 0 END) * 100 as accuracy_rate,
            COUNT(*) * 5 as time_spent  -- 假设每个单词学习5分钟
        FROM StudyLog
        WHERE user_id = :1
        AND study_time >= TRUNC(SYSDATE) - :2
        GROUP BY TRUNC(study_time)
        ORDER BY study_date DESC
        """
        cursor.execute(sql, (user_id, days))
        stats = []
        for row in cursor.fetchall():
            stats.append(DailyStats(
                date=row[0].strftime('%Y-%m-%d'),
                words_studied=row[1],
                accuracy_rate=float(row[2]) if row[2] is not None else 0.0,
                time_spent=int(row[3]) if row[3] is not None else 0
            ))
        return stats
    finally:
        cursor.close()
        conn.close()

@router.get("/statistics/mastery/{user_id}", response_model=List[WordMasteryStats])
def get_word_mastery_statistics(user_id: int, limit: int = 20):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = """
        WITH WordStats AS (
            SELECT 
                w.word,
                COUNT(*) as review_count,
                AVG(CASE WHEN sl.status = 'correct' THEN 1 ELSE 0 END) * 100 as accuracy_rate,
                MAX(sl.study_time) as last_review_date
            FROM Word w
            LEFT JOIN StudyLog sl ON w.word_id = sl.word_id AND sl.user_id = :1
            GROUP BY w.word
        )
        SELECT 
            word,
            CASE 
                WHEN accuracy_rate >= 90 THEN 'mastered'
                WHEN accuracy_rate >= 70 THEN 'learning'
                ELSE 'not_started'
            END as mastery_level,
            last_review_date,
            review_count,
            accuracy_rate
        FROM WordStats
        ORDER BY last_review_date DESC NULLS LAST
        FETCH FIRST :2 ROWS ONLY
        """
        cursor.execute(sql, (user_id, limit))
        stats = []
        for row in cursor.fetchall():
            stats.append(WordMasteryStats(
                word=row[0],
                mastery_level=row[1],
                last_review_date=row[2].strftime('%Y-%m-%d') if row[2] else None,
                review_count=row[3],
                accuracy_rate=float(row[4]) if row[4] is not None else 0.0
            ))
        return stats
    finally:
        cursor.close()
        conn.close()

@router.get("/statistics/weekly/{user_id}", response_model=List[WeeklyProgress])
def get_weekly_statistics(user_id: int, weeks: int = 4):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = """
        WITH WeeklyStats AS (
            SELECT 
                TRUNC(study_time, 'IW') as week_start,
                COUNT(DISTINCT word_id) as words_studied,
                AVG(CASE WHEN status = 'correct' THEN 1 ELSE 0 END) * 100 as average_accuracy,
                COUNT(DISTINCT TRUNC(study_time)) as study_days
            FROM StudyLog
            WHERE user_id = :1
            AND study_time >= TRUNC(SYSDATE) - (:2 * 7)
            GROUP BY TRUNC(study_time, 'IW')
        )
        SELECT 
            week_start,
            words_studied,
            average_accuracy,
            study_days
        FROM WeeklyStats
        ORDER BY week_start DESC
        """
        cursor.execute(sql, (user_id, weeks))
        stats = []
        for row in cursor.fetchall():
            stats.append(WeeklyProgress(
                week_start=row[0].strftime('%Y-%m-%d'),
                words_studied=row[1],
                average_accuracy=float(row[2]) if row[2] is not None else 0.0,
                study_time=0,  # 暂时移除学习时间统计
                streak_days=row[3]
            ))
        return stats
    finally:
        cursor.close()
        conn.close()

@router.get("/statistics/categories/{user_id}", response_model=List[CategoryStats])
def get_category_statistics(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        sql = """
        WITH WordMastery AS (
            SELECT 
                w.word_id,
                w.list_id,
                CASE 
                    WHEN AVG(CASE WHEN sl.status = 'correct' THEN 1 ELSE 0 END) >= 0.9 THEN 'mastered'
                    WHEN AVG(CASE WHEN sl.status = 'correct' THEN 1 ELSE 0 END) >= 0.7 THEN 'learning'
                    ELSE 'not_started'
                END as mastery_level
            FROM Word w
            LEFT JOIN StudyLog sl ON w.word_id = sl.word_id AND sl.user_id = :1
            GROUP BY w.word_id, w.list_id
        )
        SELECT 
            NVL(wl.difficulty, '未分类') as category,
            COUNT(*) as word_count,
            SUM(CASE WHEN mastery_level = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
            SUM(CASE WHEN mastery_level = 'learning' THEN 1 ELSE 0 END) as learning_count,
            SUM(CASE WHEN mastery_level = 'not_started' THEN 1 ELSE 0 END) as not_started_count
        FROM WordMastery wm
        LEFT JOIN WordList wl ON wm.list_id = wl.list_id
        GROUP BY wl.difficulty
        ORDER BY category
        """
        cursor.execute(sql, (user_id,))
        stats = []
        for row in cursor.fetchall():
            stats.append(CategoryStats(
                category=row[0],
                word_count=row[1],
                mastered_count=row[2],
                learning_count=row[3],
                not_started_count=row[4]
            ))
        return stats
    finally:
        cursor.close()
        conn.close() 