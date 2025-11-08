"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Users, GraduationCap } from "lucide-react"
import { DataService } from "@/lib/data-service"
import Dashboard from "./dashboard/page"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<"student" | "teacher" | "admin">("student")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 检查登录状态
  useEffect(() => {
    const savedUser = DataService.getUserState()
    if (savedUser) {
      setCurrentUser(savedUser)
      setUserRole(savedUser.role)
      setIsLoggedIn(true)
    }
  }, [])

  // 登录表单状态
  type LoginForm = { username: string; password: string }
  const [loginData, setLoginData] = useState<{
    student: LoginForm;
    teacher: LoginForm;
    admin: LoginForm;
  }>({
    student: { username: "", password: "" },
    teacher: { username: "", password: "" },
    admin: { username: "", password: "" },
  })

  const handleLogin = async (role: "student" | "teacher" | "admin") => {
    setLoading(true)
    setError("")

    try {
      const { username, password } = loginData[role]
      const result = await DataService.login(username, password, role)

      if (result.success && result.user) {
        setCurrentUser(result.user)
        setUserRole(role)
        setIsLoggedIn(true)
        DataService.saveUserState(result.user) // 保存用户状态
      } else {
        setError(result.message || "登录失败")
      }
    } catch (error) {
      setError("登录过程中发生错误")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    DataService.clearUserState()
    setIsLoggedIn(false)
    setCurrentUser(null)
  }

  const updateLoginData = (role: "student" | "teacher" | "admin", field: "username" | "password", value: string) => {
    setLoginData((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value,
      },
    }))
  }

  if (isLoggedIn && currentUser) {
    return <Dashboard userRole={userRole} currentUser={currentUser} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">智能英语词汇记忆系统</h1>
          <p className="text-gray-600">Smart Vocabulary Memorization System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>登录系统</CardTitle>
            <CardDescription>选择您的身份并登录</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="student" className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  学生
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  老师
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  管理员
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="student-username">用户名</Label>
                  <Input
                    id="student-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={loginData.student.username}
                    onChange={(e) => updateLoginData("student", "username", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-password">密码</Label>
                  <Input
                    id="student-password"
                    type="password"
                    placeholder="student123"
                    value={loginData.student.password}
                    onChange={(e) => updateLoginData("student", "password", e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => handleLogin("student")} disabled={loading}>
                  {loading ? "登录中..." : "学生登录"}
                </Button>
                <div className="text-center space-y-2">
                  <div className="text-xs text-gray-500">测试账号: 用户名 student1 / 密码 student123</div>
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => router.push("/register")}
                  >
                    还没有账号？立即注册
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="teacher" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-username">用户名</Label>
                  <Input
                    id="teacher-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={loginData.teacher.username}
                    onChange={(e) => updateLoginData("teacher", "username", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-password">密码</Label>
                  <Input
                    id="teacher-password"
                    type="password"
                    placeholder="teacher123"
                    value={loginData.teacher.password}
                    onChange={(e) => updateLoginData("teacher", "password", e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => handleLogin("teacher")} disabled={loading}>
                  {loading ? "登录中..." : "老师登录"}
                </Button>
                <div className="text-center space-y-2">
                  <div className="text-xs text-gray-500">测试账号: 用户名 teacher / 密码 teacher123</div>
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => router.push("/register")}
                  >
                    还没有账号？立即注册
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">用户名</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="请输入用户名"
                    value={loginData.admin.username}
                    onChange={(e) => updateLoginData("admin", "username", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">密码</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="admin123"
                    value={loginData.admin.password}
                    onChange={(e) => updateLoginData("admin", "password", e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={() => handleLogin("admin")} disabled={loading}>
                  {loading ? "登录中..." : "管理员登录"}
                </Button>
                <div className="text-xs text-gray-500 text-center">测试账号: 用户名 admin / 密码 admin123</div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
