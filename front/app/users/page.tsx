"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserPlus, Settings, Shield, Award } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"

// 扩展用户数据类型
interface UserWithStats extends User {
  avatar?: string
  joinDate: string
  lastActive: string
  wordsLearned: number
  streak: number
  status: "active" | "inactive"
}

interface UserManagementProps {
  currentUser: User
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedTab, setSelectedTab] = useState("overview")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formError, setFormError] = useState("")

  // 新用户表单数据
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "student" as "student" | "teacher" | "admin",
  })

  // 编辑用户表单数据
  const [editUser, setEditUser] = useState({
    username: "",
    email: "",
    role: "student" as "student" | "teacher" | "admin",
  })

  // 模拟扩展用户数据
  const [userData, setUserData] = useState<UserWithStats[]>([])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await DataService.getUsers()
        setUsers(usersData)

        // 模拟扩展数据
        const extendedUsers: UserWithStats[] = usersData.map((user) => ({
          ...user,
          avatar: "/placeholder.svg?height=40&width=40",
          joinDate: user.create_time?.split("T")[0] || "2024-01-01",
          lastActive: "2024-01-20",
          wordsLearned: Math.floor(Math.random() * 1500) + 500,
          streak: Math.floor(Math.random() * 10),
          status: Math.random() > 0.3 ? "active" : "inactive",
        }))
        setUserData(extendedUsers)
      } catch (error) {
        console.error("Failed to load users:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  const filteredUsers = userData.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const totalUsers = userData.length
  const activeUsers = userData.filter((user) => user.status === "active").length
  const students = userData.filter((user) => user.role === "student").length
  const teachers = userData.filter((user) => user.role === "teacher").length

  const deleteUser = async (userId: number) => {
    try {
      await DataService.deleteUser(userId)
      setUserData(userData.filter((user) => user.user_id !== userId))
      setShowDeleteDialog(false)
      toast.success("用户已删除")
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast.error("删除用户失败")
    }
  }

  const handleCreateUser = async () => {
    setFormError("")
    if (!newUser.username || !newUser.email) {
      setFormError("用户名和邮箱不能为空")
      return
    }

    try {
      const result = await DataService.register({
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        password: "123456", // 默认密码
      })

      if (result.success && result.user) {
        // 添加模拟的统计数据
        const extendedUser: UserWithStats = {
          ...result.user,
          avatar: "/placeholder.svg?height=40&width=40",
          joinDate: result.user.create_time?.split("T")[0] || new Date().toISOString().split("T")[0],
          lastActive: new Date().toISOString().split("T")[0],
          wordsLearned: 0,
          streak: 0,
          status: "active",
        }

        setUserData([...userData, extendedUser])
        setShowCreateDialog(false)
        setNewUser({
          username: "",
          email: "",
          role: "student",
        })
        toast.success("用户创建成功")
      } else {
        setFormError(result.message || "创建用户失败")
        toast.error(result.message || "创建用户失败")
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      setFormError("创建用户失败")
      toast.error("创建用户失败")
    }
  }

  const handleEditUser = async () => {
    setFormError("")
    if (!selectedUser || !editUser.username || !editUser.email) {
      setFormError("用户名和邮箱不能为空")
      return
    }

    try {
      // 使用 DataService 更新用户
      const updatedUser = await DataService.updateUser(selectedUser.user_id, {
        username: editUser.username,
        email: editUser.email,
        role: editUser.role,
      })

      // 更新本地数据
      const updatedUserData = userData.map((user) => {
        if (user.user_id === selectedUser.user_id) {
          return {
            ...user,
            ...updatedUser,
          }
        }
        return user
      })

      setUserData(updatedUserData)
      setShowEditDialog(false)
      toast.success("用户信息已更新")
    } catch (error) {
      console.error("Failed to update user:", error)
      setFormError("更新用户失败")
      toast.error("更新用户失败")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditUser({
      username: user.username,
      email: user.email || "",
      role: user.role,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户和权限</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          添加用户
        </Button>
      </div>

      {/* 用户统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">注册用户</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">近7天活跃</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学生用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students}</div>
            <p className="text-xs text-muted-foreground">学习者</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">教师用户</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers}</div>
            <p className="text-xs text-muted-foreground">教育者</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">用户概览</TabsTrigger>
          <TabsTrigger value="permissions">权限管理</TabsTrigger>
          <TabsTrigger value="analytics">用户分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 搜索和筛选 */}
          <Card>
            <CardHeader>
              <CardTitle>搜索用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索用户名或邮箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">全部角色</option>
                  <option value="student">学生</option>
                  <option value="teacher">教师</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <CardDescription>系统中的所有用户</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(filteredUsers || []).map((user) => (
                  <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={user.role === "teacher" ? "default" : "secondary"}>
                            {user.role === "student" ? "学生" : user.role === "teacher" ? "教师" : "管理员"}
                          </Badge>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "活跃" : "非活跃"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">学习词汇: </span>
                          <span className="font-semibold">{user.wordsLearned}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">连续打卡: </span>
                          <span className="font-semibold">{user.streak}天</span>
                        </div>
                        <div className="text-sm text-muted-foreground">最后活跃: {user.lastActive}</div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                          <Settings className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(user)}>
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>权限管理</CardTitle>
              <CardDescription>管理不同角色的系统权限</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">学生权限</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✓ 学习单词</li>
                        <li>✓ 查看复习计划</li>
                        <li>✓ 参加测试</li>
                        <li>✓ 查看统计</li>
                        <li>✓ 管理错题本</li>
                        <li>✗ 管理词库</li>
                        <li>✗ 查看其他用户</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">教师权限</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✓ 所有学生权限</li>
                        <li>✓ 创建词表</li>
                        <li>✓ 管理词表</li>
                        <li>✓ 查看学生进度</li>
                        <li>✓ 导入/导出词表</li>
                        <li>✗ 用户管理</li>
                        <li>✗ 系统设置</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">管理员权限</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✓ 所有教师权限</li>
                        <li>✓ 用户管理</li>
                        <li>✓ 权限管理</li>
                        <li>✓ 系统设置</li>
                        <li>✓ 数据备份</li>
                        <li>✓ 系统监控</li>
                        <li>✓ 全局统计</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户分析</CardTitle>
              <CardDescription>用户行为和学习数据分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">用户活跃度</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>日活跃用户</span>
                      <span className="font-semibold">{Math.floor(activeUsers * 0.4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>周活跃用户</span>
                      <span className="font-semibold">{Math.floor(activeUsers * 0.8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>月活跃用户</span>
                      <span className="font-semibold">{activeUsers}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">学习统计</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>平均学习时长</span>
                      <span className="font-semibold">25分钟</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均词汇掌握</span>
                      <span className="font-semibold">
                        {Math.floor(userData.reduce((sum, user) => sum + user.wordsLearned, 0) / userData.length)}个
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均正确率</span>
                      <span className="font-semibold">82%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建用户对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>创建新用户</DialogTitle>
            <DialogDescription>添加一个新用户到系统中</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{formError}</div>}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as "student" | "teacher" | "admin" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="teacher">教师</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateUser}>创建用户</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">{formError}</div>}
            <div className="space-y-2">
              <Label htmlFor="edit-username">用户名</Label>
              <Input
                id="edit-username"
                value={editUser.username}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                placeholder="请输入邮箱"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">角色</Label>
              <Select
                value={editUser.role}
                onValueChange={(value) => setEditUser({ ...editUser, role: value as "student" | "teacher" | "admin" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="teacher">教师</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEditUser}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>此操作不可撤销，确定要删除此用户吗？</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedUser && (
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-md">
                <Avatar>
                  <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedUser.username}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedUser.role === "student" ? "学生" : selectedUser.role === "teacher" ? "教师" : "管理员"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={() => selectedUser && deleteUser(selectedUser.user_id)}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
