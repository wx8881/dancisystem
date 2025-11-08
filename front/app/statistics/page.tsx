"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Target, Award, Clock, Brain } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { User } from "@/lib/types"

interface StatisticsProps {
  currentUser: User
}

export default function Statistics({ currentUser }: StatisticsProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const statisticsData = await DataService.getStudyStatistics(currentUser.user_id)
        setStats(statisticsData)
      } catch (error) {
        console.error("Failed to load statistics:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStatistics()
  }, [currentUser.user_id])

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  if (!stats) {
    return <div className="flex justify-center items-center h-64">暂无统计数据</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">学习统计</h1>
        <p className="text-muted-foreground">详细的学习数据分析和进度追踪</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总词汇量</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWords || 0}</div>
            <p className="text-xs text-muted-foreground">已学习单词</p>
            <Progress value={stats.totalWords ? (stats.masteredWords / stats.totalWords) * 100 : 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">掌握程度</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalWords ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.masteredWords || 0}/{stats.totalWords || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习天数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studyDays || 0}</div>
            <p className="text-xs text-muted-foreground">连续打卡 {stats.streak || 0} 天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均正确率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageAccuracy || 0)}%</div>
            <p className="text-xs text-muted-foreground">持续提升中</p>
          </CardContent>
        </Card>
      </div>

      {/* 本周学习情况 */}
      <Card>
        <CardHeader>
          <CardTitle>本周学习情况</CardTitle>
          <CardDescription>每日学习单词数量和正确率统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.weeklyProgress?.map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 text-sm font-medium">{day.date}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{day.count || 0} 个单词</span>
                      <span className="text-sm text-muted-foreground">{day.accuracy || 0}%</span>
                    </div>
                    <Progress value={((day.count || 0) / 50) * 100} className="h-2" />
                  </div>
                </div>
                <Badge variant={(day.accuracy || 0) >= 85 ? "default" : "secondary"} className="ml-4">
                  {(day.accuracy || 0) >= 85 ? "优秀" : "良好"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类进度 */}
        <Card>
          <CardHeader>
            <CardTitle>分类学习进度</CardTitle>
            <CardDescription>不同词汇类别的掌握情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.categoryProgress?.map((category: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{category.category}</Badge>
                      <span className="text-sm font-medium">
                        {category.mastered || 0}/{category.total || 0}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{category.progress || 0}%</span>
                  </div>
                  <Progress value={category.total ? ((category.mastered || 0) / category.total) * 100 : 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 月度趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>月度学习趋势</CardTitle>
            <CardDescription>最近6个月的学习数据对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.monthlyData?.map((month: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{month.month}</div>
                    <div className="space-y-1">
                      <div className="text-sm">学习 {month.count || 0} 个单词</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学习时间分析 */}
      <Card>
        <CardHeader>
          <CardTitle>学习时间分析</CardTitle>
          <CardDescription>今日学习时间分布和效率分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.studyTime || 0}</div>
              <div className="text-sm text-muted-foreground">今日学习时间（分钟）</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.studyTime ? Math.round((stats.weeklyProgress?.reduce((sum: number, day: any) => sum + (day.count || 0), 0) / stats.studyTime) * 60) : 0}
              </div>
              <div className="text-sm text-muted-foreground">每小时学习单词数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.weeklyProgress?.length ? Math.round(stats.weeklyProgress.reduce((sum: number, day: any) => sum + (day.accuracy || 0), 0) / stats.weeklyProgress.length) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">本周平均正确率</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 成就徽章 */}
      <Card>
        <CardHeader>
          <CardTitle>学习成就</CardTitle>
          <CardDescription>您已获得的学习徽章和里程碑</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="font-semibold">连续打卡</div>
              <div className="text-sm text-muted-foreground">{stats.streak || 0}天</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold">词汇达人</div>
              <div className="text-sm text-muted-foreground">{stats.totalWords || 0}+单词</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-semibold">高效学习</div>
              <div className="text-sm text-muted-foreground">{Math.round(stats.averageAccuracy || 0)}%+正确率</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold">时间管理</div>
              <div className="text-sm text-muted-foreground">{stats.studyDays || 0}天学习</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
