"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, Brain, TrendingUp, CheckCircle } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { ReviewSchedule, User } from "@/lib/types"

// 模拟复习数据
const reviewData = [
  {
    date: "今天",
    type: "第1天复习",
    words: [
      { word: "abandon", status: "pending", difficulty: "CET-4" },
      { word: "ability", status: "completed", difficulty: "CET-4" },
      { word: "abstract", status: "pending", difficulty: "CET-6" },
    ],
  },
  {
    date: "明天",
    type: "第3天复习",
    words: [
      { word: "accelerate", status: "pending", difficulty: "CET-6" },
      { word: "accommodate", status: "pending", difficulty: "GRE" },
    ],
  },
  {
    date: "3天后",
    type: "第7天复习",
    words: [
      { word: "achieve", status: "pending", difficulty: "CET-4" },
      { word: "acquire", status: "pending", difficulty: "CET-6" },
    ],
  },
  {
    date: "1周后",
    type: "第15天复习",
    words: [{ word: "adequate", status: "pending", difficulty: "CET-6" }],
  },
  {
    date: "1个月后",
    type: "第30天复习",
    words: [
      { word: "adjacent", status: "pending", difficulty: "GRE" },
      { word: "advocate", status: "pending", difficulty: "GRE" },
    ],
  },
]

interface ReviewPlanProps {
  currentUser: User
}

export default function ReviewPlan({ currentUser }: ReviewPlanProps) {
  const [selectedDate, setSelectedDate] = useState("今天")
  const [reviewSchedule, setReviewSchedule] = useState<ReviewSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReviewSchedule = async () => {
      try {
        const schedule = await DataService.getReviewSchedule(currentUser.user_id)
        setReviewSchedule(schedule)
      } catch (error) {
        console.error("Failed to load review schedule:", error)
      } finally {
        setLoading(false)
      }
    }
    loadReviewSchedule()
  }, [currentUser.user_id])

  const totalWords = reviewData.reduce((sum, day) => sum + day.words.length, 0)
  const completedWords = reviewData.reduce(
    (sum, day) => sum + day.words.filter((word) => word.status === "completed").length,
    0,
  )
  const todayWords = reviewData.find((day) => day.date === "今天")?.words || []
  const todayCompleted = todayWords.filter((word) => word.status === "completed").length

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">复习计划</h1>
          <p className="text-muted-foreground">基于艾宾浩斯遗忘曲线的智能复习安排</p>
        </div>
      </div>

      {/* 复习概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日复习</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayWords.length}</div>
            <p className="text-xs text-muted-foreground">个单词</p>
            <Progress value={(todayCompleted / todayWords.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总复习量</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWords}</div>
            <p className="text-xs text-muted-foreground">待复习单词</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成进度</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((completedWords / totalWords) * 100)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedWords}/{totalWords}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">记忆强度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">平均记忆强度</p>
          </CardContent>
        </Card>
      </div>

      {/* 艾宾浩斯遗忘曲线说明 */}
      <Card>
        <CardHeader>
          <CardTitle>艾宾浩斯遗忘曲线</CardTitle>
          <CardDescription>科学的记忆复习间隔安排</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1天</div>
              <div className="text-sm text-muted-foreground">第一次复习</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3天</div>
              <div className="text-sm text-muted-foreground">第二次复习</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">7天</div>
              <div className="text-sm text-muted-foreground">第三次复习</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">15天</div>
              <div className="text-sm text-muted-foreground">第四次复习</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">30天</div>
              <div className="text-sm text-muted-foreground">第五次复习</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 复习计划列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {reviewData.map((day, index) => (
            <Card key={index} className={selectedDate === day.date ? "ring-2 ring-blue-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{day.date}</CardTitle>
                    <CardDescription>{day.type}</CardDescription>
                  </div>
                  <Badge variant="outline">{day.words.length} 个单词</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {day.words.map((word, wordIndex) => (
                    <div key={wordIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            word.status === "completed" ? "bg-green-500" : "bg-gray-300"
                          }`}
                        />
                        <span className="font-medium">{word.word}</span>
                        <Badge variant="secondary" className="text-xs">
                          {word.difficulty}
                        </Badge>
                      </div>
                      {word.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 侧边栏 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">复习建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">最佳复习时间</div>
                <div className="text-blue-600">上午9-11点，下午3-5点</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">复习方法</div>
                <div className="text-green-600">主动回忆 + 间隔重复</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="font-medium text-yellow-800">注意事项</div>
                <div className="text-yellow-600">保持规律，避免突击</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">记忆统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>短期记忆</span>
                <span className="font-semibold">75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-between">
                <span>中期记忆</span>
                <span className="font-semibold">60%</span>
              </div>
              <Progress value={60} className="h-2" />
              <div className="flex justify-between">
                <span>长期记忆</span>
                <span className="font-semibold">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
