from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from db_config import get_oracle_conn
from fastapi.middleware.cors import CORSMiddleware
import datetime
from users import router as users_router
from words import router as words_router
from wordlists import router as wordlists_router
from studylog import router as studylog_router
from review import router as review_router
from wrongwords import router as wrongwords_router
from favorite import router as favorite_router
from checkin import router as checkin_router
from statistics import router as statistics_router
from test import router as test_router
from search import router as search_router

app = FastAPI()

# 允许跨域（开发用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ 数据模型 ------------------
class User(BaseModel):
    user_id: int
    username: str
    role: str
    email: Optional[str] = None
    create_time: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class LoginResponse(BaseModel):
    success: bool
    user: Optional[User] = None
    message: Optional[str] = None

class DashboardReviewItem(BaseModel):
    word: str
    type: str
    count: int

class DashboardData(BaseModel):
    todayStudied: int
    totalWords: int
    streak: int
    accuracy: int
    todayReview: int
    weeklyGoal: int
    weeklyProgress: int
    recentWords: List[Dict[str, Any]]
    upcomingReviews: List[DashboardReviewItem]

# ------------------ 登录接口 ------------------
@app.post("/api/login", response_model=LoginResponse)
def login(data: LoginRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'SELECT user_id, username, role, email, create_time FROM "User" WHERE username=:username AND password=:password AND role=:role',
            username=data.username, password=data.password, role=data.role
        )
        row = cursor.fetchone()
        if row:
            user = User(
                user_id=row[0],
                username=row[1],
                role=row[2],
                email=row[3],
                create_time=row[4].strftime('%Y-%m-%d') if row[4] else None
            )
            return {"success": True, "user": user}
        else:
            return {"success": False, "message": "用户名或密码错误"}
    finally:
        cursor.close()
        conn.close()

# ------------------ 仪表盘接口 ------------------
@app.get("/api/dashboard/{user_id}", response_model=DashboardData)
def get_dashboard(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT COUNT(*) FROM StudyLog WHERE user_id=:user_id AND TRUNC(study_time) = TRUNC(SYSDATE)', user_id=user_id)
        today_studied = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(DISTINCT word_id) FROM StudyLog WHERE user_id=:user_id', user_id=user_id)
        total_words = cursor.fetchone()[0]
        cursor.execute('SELECT MAX(streak) FROM (SELECT COUNT(*) AS streak FROM (SELECT checkin_date, ROW_NUMBER() OVER (ORDER BY checkin_date DESC) rn FROM CheckInLog WHERE user_id=:user_id) GROUP BY checkin_date - rn)', user_id=user_id)
        streak = cursor.fetchone()[0] or 0
        cursor.execute('SELECT AVG(accuracy_rate) FROM CheckInLog WHERE user_id=:user_id', user_id=user_id)
        accuracy = int(cursor.fetchone()[0] or 0)
        cursor.execute('SELECT COUNT(*) FROM ReviewSchedule WHERE user_id=:user_id AND TRUNC(review_date) = TRUNC(SYSDATE)', user_id=user_id)
        today_review = cursor.fetchone()[0]
        weekly_goal = 200
        cursor.execute('SELECT COUNT(*) FROM StudyLog WHERE user_id=:user_id AND study_time >= TRUNC(SYSDATE) - 7', user_id=user_id)
        weekly_progress = cursor.fetchone()[0]
        cursor.execute('''SELECT w.word_id, w.word FROM StudyLog s JOIN Word w ON s.word_id=w.word_id WHERE s.user_id=:user_id ORDER BY s.study_time DESC FETCH FIRST 5 ROWS ONLY''', user_id=user_id)
        recent_words = [ {"word_id": r[0], "word": r[1]} for r in cursor.fetchall() ]
        cursor.execute('''
            SELECT w.word, 
                   '第' || TO_CHAR(r.repeat_count + 1) || '天复习' AS type, 
                   COUNT(*) AS cnt 
            FROM ReviewSchedule r 
            JOIN Word w ON r.word_id=w.word_id 
            WHERE r.user_id=:user_id AND r.review_date >= SYSDATE 
            GROUP BY w.word, r.repeat_count
        ''', user_id=user_id)
        upcoming_reviews = [ {"word": r[0], "type": r[1], "count": r[2]} for r in cursor.fetchall() ]
        while len(upcoming_reviews) < 3:
            upcoming_reviews.append({"word": "-", "type": "第1天复习", "count": 0})
        return {
            "todayStudied": today_studied,
            "totalWords": total_words,
            "streak": streak,
            "accuracy": accuracy,
            "todayReview": today_review,
            "weeklyGoal": weekly_goal,
            "weeklyProgress": weekly_progress,
            "recentWords": recent_words,
            "upcomingReviews": upcoming_reviews[:3],
        }
    finally:
        cursor.close()
        conn.close()

# 注册路由
app.include_router(users_router, prefix="/api")
app.include_router(words_router, prefix="/api")
app.include_router(wordlists_router, prefix="/api")
app.include_router(studylog_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(wrongwords_router, prefix="/api")
app.include_router(favorite_router, prefix="/api")
app.include_router(checkin_router, prefix="/api")
app.include_router(statistics_router, prefix="/api")
app.include_router(test_router, prefix="/api")
app.include_router(search_router, prefix="/api")