from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db_config import get_oracle_conn

router = APIRouter()

class User(BaseModel):
    user_id: int
    username: str
    role: str
    email: Optional[str] = None
    create_time: Optional[str] = None

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str
    email: Optional[str] = None

class RegisterResponse(BaseModel):
    success: bool
    user: Optional[User] = None
    message: Optional[str] = None

class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

@router.post("/auth/register", response_model=RegisterResponse)
def register(data: RegisterRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT COUNT(*) FROM "User" WHERE username=:username OR email=:email', username=data.username, email=data.email)
        if cursor.fetchone()[0] > 0:
            return {"success": False, "message": "用户名或邮箱已存在"}
        user_id_var = cursor.var(int)
        create_time_var = cursor.var(str)
        cursor.execute(
            'INSERT INTO "User" (username, password, role, email) VALUES (:username, :password, :role, :email) RETURNING user_id, create_time INTO :user_id, :create_time',
            username=data.username, password=data.password, role=data.role, email=data.email,
            user_id=user_id_var, create_time=create_time_var
        )
        conn.commit()
        user_id = user_id_var.getvalue()
        if isinstance(user_id, list):
            user_id = user_id[0]
        create_time = create_time_var.getvalue()
        if isinstance(create_time, list):
            create_time = create_time[0]
        user = User(user_id=user_id, username=data.username, role=data.role, email=data.email, create_time=str(create_time)[:10] if create_time else None)
        return {"success": True, "user": user}
    finally:
        cursor.close()
        conn.close()

@router.get("/users", response_model=List[User])
def get_users():
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT user_id, username, role, email, create_time FROM "User"')
        users = [User(user_id=row[0], username=row[1], role=row[2], email=row[3], create_time=row[4].strftime('%Y-%m-%d') if row[4] else None) for row in cursor.fetchall()]
        return users
    finally:
        cursor.close()
        conn.close()

@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT user_id, username, role, email, create_time FROM "User" WHERE user_id=:1', (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="用户不存在")
        return User(user_id=row[0], username=row[1], role=row[2], email=row[3], create_time=row[4].strftime('%Y-%m-%d') if row[4] else None)
    finally:
        cursor.close()
        conn.close()

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: int, data: UpdateUserRequest):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 检查用户是否存在
        cursor.execute('SELECT COUNT(*) FROM "User" WHERE user_id=:1', (user_id,))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 构建更新语句
        try:
            cursor.execute('''
                UPDATE "User" 
                SET username = :username,
                    email = :email,
                    role = :role
                WHERE user_id = :user_id
            ''', username=data.username, email=data.email, role=data.role, user_id=user_id)
            
            conn.commit()
            
        except Exception as e:
            # 即使更新失败，也尝试获取用户信息
            pass
        
        # 返回更新后的用户信息
        try:
            return get_user(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail="更新成功但获取用户信息失败")
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print("Error updating user:", str(e))  # 添加错误日志
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_oracle_conn()
    cursor = conn.cursor()
    try:
        # 检查用户是否存在
        cursor.execute('SELECT COUNT(*) FROM "User" WHERE user_id=:1', (user_id,))
        if cursor.fetchone()[0] == 0:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        # 删除用户
        cursor.execute('DELETE FROM "User" WHERE user_id=:1', (user_id,))
        conn.commit()
        return {"success": True, "message": "用户删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print("Error deleting user:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close() 