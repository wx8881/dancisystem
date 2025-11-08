"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  Award,
  Brain,
  Search,
  FileText,
  LogOut,
  Users,
  Database,
  Book,
  CheckCircle,
} from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { User, DashboardData } from "@/lib/types"
import StudyModule from "../study/page"
import ReviewPlan from "../review/page"
import TestModule from "../test/page"
import Statistics from "../statistics/page"
import ErrorBook from "../errors/page"
import VocabularyManagement from "../vocabulary/page"
import UserManagement from "../users/page"

interface DashboardProps {
  userRole: "student" | "teacher" | "admin"
  currentUser: User
  onLogout: () => void
}

export default function Dashboard({ userRole, currentUser, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewIntensity, setReviewIntensity] = useState<"light" | "medium" | "intensive">("medium")

  // 加载仪表板数据
  useEffect(() => {
    if (!currentUser?.user_id) return

    const loadData = async () => {
      try {
        const data = await DataService.getDashboardData(currentUser.user_id)
        setDashboardData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败')
      } finally {
        setLoading(false)
      }
    }

    // 首次加载
    loadData()

    // 设置定时器，每30秒刷新一次
    const timer = setInterval(loadData, 30000)

    // 清理定时器
    return () => clearInterval(timer)
  }, [currentUser?.user_id]) // 只在user_id变化时重新加载

  // 添加手动刷新功能
  const handleRefresh = async () => {
    if (!currentUser?.user_id) return
    setLoading(true)
    try {
      const data = await DataService.getDashboardData(currentUser.user_id)
      setDashboardData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 模拟复习计划数据
  const getReviewPlan = (intensity: "light" | "medium" | "intensive") => {
    const baseCount = {
      light: 5,
      medium: 10,
      intensive: 15
    }[intensity];

    return [
      {
        day: 1,
        count: baseCount,
        words: ["ability", "abandon", "abstract", "academic", "accelerate"].slice(0, baseCount)
      },
      {
        day: 2,
        count: Math.floor(baseCount * 0.8),
        words: ["accept", "access", "accident", "accomplish", "accurate"].slice(0, Math.floor(baseCount * 0.8))
      },
      {
        day: 3,
        count: Math.floor(baseCount * 0.6),
        words: ["achieve", "acknowledge", "acquire", "adapt", "adequate"].slice(0, Math.floor(baseCount * 0.6))
      }
    ];
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "study":
        return <StudyModule currentUser={currentUser} />
      case "review":
        return <ReviewPlan currentUser={currentUser} />
      case "test":
        return <TestModule currentUser={currentUser} />
      case "statistics":
        return <Statistics currentUser={currentUser} />
      case "errors":
        return <ErrorBook currentUser={currentUser} />
      case "vocabulary":
        return <VocabularyManagement currentUser={currentUser} />
      case "users":
        return <UserManagement currentUser={currentUser} />
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => {
    if (loading && !dashboardData) {
      return <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }

    if (error) {
      return <div className="text-red-500 text-center p-4">{error}</div>
    }

    if (!dashboardData) {
      return <div className="text-center p-4">暂无数据</div>
    }

    return (
      <div className="space-y-6">
        {/* 今日概览 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">学习仪表板</h1>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            刷新数据
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日学习</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.todayStudied}</div>
              <p className="text-xs text-muted-foreground">个单词</p>
              <Progress value={(dashboardData.todayStudied / 50) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总词汇量</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalWords || 0}</div>
              <p className="text-xs text-muted-foreground">个单词</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已掌握词汇</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.max(0, dashboardData.masteredWords || 0)}</div>
              <p className="text-xs text-muted-foreground">个单词</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">连续打卡</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.max(0, dashboardData.streak || 0)}</div>
              <p className="text-xs text-muted-foreground">天</p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快速开始</CardTitle>
            <CardDescription>选择您想要进行的学习活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setCurrentPage("study")}>
                <Brain className="h-6 w-6" />
                开始背单词
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setCurrentPage("review")}>
                <Clock className="h-6 w-6" />
                复习计划
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setCurrentPage("test")}>
                <FileText className="h-6 w-6" />
                单词测试
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setCurrentPage("errors")}>
                <Search className="h-6 w-6" />
                错题本
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 复习计划卡片 */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>今日复习计划</CardTitle>
                <CardDescription>基于艾宾浩斯遗忘曲线的智能复习安排</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={reviewIntensity === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReviewIntensity("light")}
                >
                  轻松模式
                </Button>
                <Button
                  variant={reviewIntensity === "medium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReviewIntensity("medium")}
                >
                  标准模式
                </Button>
                <Button
                  variant={reviewIntensity === "intensive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReviewIntensity("intensive")}
                >
                  强化模式
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getReviewPlan(reviewIntensity).map((plan, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">第{plan.day}天复习</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plan.count}</div>
                    <p className="text-xs text-muted-foreground">个单词</p>
                    <div className="mt-2 space-y-1">
                      {plan.words.map((word, wordIndex) => (
                        <div key={wordIndex} className="text-sm text-muted-foreground">
                          {word}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getNavigationItems = () => {
    const commonItems = [
      { id: "dashboard", label: "仪表板", icon: TrendingUp },
      { id: "study", label: "背单词", icon: Brain },
      { id: "review", label: "复习计划", icon: Calendar },
      { id: "test", label: "单词测试", icon: FileText },
      { id: "statistics", label: "学习统计", icon: TrendingUp },
      { id: "errors", label: "错题本", icon: Search },
    ]

    if (userRole === "admin") {
      return [
        ...commonItems,
        { id: "vocabulary", label: "词库管理", icon: Database },
        { id: "users", label: "用户管理", icon: Users },
      ]
    }

    if (userRole === "teacher") {
      return [...commonItems, { id: "vocabulary", label: "词表管理", icon: BookOpen }]
    }

    return commonItems
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">智能词汇记忆系统</h1>
                <p className="text-sm text-gray-500">
                  欢迎，{currentUser.username} ({userRole === "student" && "学生"}
                  {userRole === "teacher" && "教师"}
                  {userRole === "admin" && "管理员"})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* 侧边导航 */}
          <aside className="w-64 space-y-2">
            {getNavigationItems().map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </aside>

          {/* 主内容区域 */}
          <main className="flex-1">{renderCurrentPage()}</main>
        </div>
      </div>
    </div>
  )
}
