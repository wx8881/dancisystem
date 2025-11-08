import type {
  Word,
  WrongWord,
  TestQuestion,
  WordList,
  ReviewSchedule,
  User,
  CheckInLog,
  StudyLog,
  TestResult,
} from "./types"

export const API_BASE_URL = "http://localhost:8000/api"

// 用户状态管理
const USER_STORAGE_KEY = "current_user"

interface StudyStatistics {
  totalWords: number
  masteredWords: number
  studyDays: number
  streak: number
  averageAccuracy: number
  weeklyProgress: { date: string; count: number }[]
  categoryProgress: { category: string; progress: number }[]
  monthlyData: { month: string; count: number }[]
}

// API 服务
export const DataService = {
  // ==================== 用户认证相关 ====================

  // 保存用户状态
  saveUserState(user: User) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  },

  // 获取用户状态
  getUserState(): User | null {
    const userStr = localStorage.getItem(USER_STORAGE_KEY)
    return userStr ? JSON.parse(userStr) : null
  },

  // 清除用户状态
  clearUserState() {
    localStorage.removeItem(USER_STORAGE_KEY)
  },

  // 用户登录
  async login(
    username: string,
    password: string,
    role: string,
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      })

      const data = await response.json()
      if (data.success && data.user) {
        this.saveUserState(data.user)
      }
      return data
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "登录失败，请稍后重试" }
    }
  },

  // 用户注册
  async register(data: {
    username: string
    email: string
    role: string
    password: string
  }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success && result.user) {
        this.saveUserState(result.user)
      }
      return result
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, message: "注册失败，请稍后重试" }
    }
  },

  // 获取当前用户信息
  async getCurrentUser(userId: number): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  },

  // ==================== 词汇相关 ====================

  // 获取词汇列表
  async getWords(listId?: number, limit?: number): Promise<Word[]> {
    try {
      const params = new URLSearchParams()
      if (listId) params.append("list_id", listId.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE_URL}/words?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get words error:", error)
      return []
    }
  },

  // 获取单个单词
  async getWord(wordId: number): Promise<Word | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/words/${wordId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get word error:", error)
      return null
    }
  },

  // 添加单词到词表
  async addWordToList(listId: number, wordData: Omit<Word, "word_id" | "list_id">): Promise<Word> {
    try {
      const response = await fetch(`${API_BASE_URL}/words`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...wordData, list_id: listId }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Add word error:", error)
      throw error
    }
  },

  // 更新单词
  async updateWord(wordId: number, wordData: Partial<Word>): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/words/${wordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(wordData),
      })
    } catch (error) {
      console.error("Update word error:", error)
      throw error
    }
  },

  // 删除单词
  async deleteWord(wordId: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/words/${wordId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Delete word error:", error)
      throw error
    }
  },

  // ==================== 词表管理 ====================

  // 获取词表列表
  async getWordLists(userId?: number): Promise<WordList[]> {
    try {
      const params = new URLSearchParams()
      if (userId) params.append("user_id", userId.toString())

      const response = await fetch(`${API_BASE_URL}/wordlists?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get word lists error:", error)
      return []
    }
  },

  // 获取单个词表
  async getWordList(listId: number): Promise<WordList | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/wordlists/${listId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get word list error:", error)
      return null
    }
  },

  // 创建词表
  async createWordList(listData: Omit<WordList, "list_id" | "create_time" | "word_count">): Promise<WordList> {
    try {
      const response = await fetch(`${API_BASE_URL}/wordlists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listData),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Create word list error:", error)
      throw error
    }
  },

  // 更新词表
  async updateWordList(listId: number, listData: Partial<WordList>): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/wordlists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(listData),
      })
    } catch (error) {
      console.error("Update word list error:", error)
      throw error
    }
  },

  // 删除词表
  async deleteWordList(listId: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/wordlists/${listId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Delete word list error:", error)
      throw error
    }
  },

  // ==================== 学习相关 ====================

  // 记录学习日志
  async logStudy(userId: number, wordId: number, status: "known" | "unknown" | "learning"): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/study/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, word_id: wordId, status }),
      })
    } catch (error) {
      console.error("Log study error:", error)
      throw error
    }
  },

  // 获取学习记录
  async getStudyLogs(userId: number, limit: number = 7): Promise<StudyLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/studylog?user_id=${userId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch study logs")
      }
      return await response.json()
    } catch (error) {
      console.error("Get study logs error:", error)
      return []
    }
  },

  // ==================== 测试相关 ====================

  // 生成测试题目
  async generateTestQuestions(count = 5, difficulty?: string): Promise<TestQuestion[]> {
    try {
      const params = new URLSearchParams()
      params.append("count", count.toString())
      if (difficulty) params.append("difficulty", difficulty)

      const response = await fetch(`${API_BASE_URL}/test/questions?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Generate test questions error:", error)
      return []
    }
  },

  // 提交测试结果
  async submitTestResult(
    userId: number,
    testData: {
      questions: TestQuestion[]
      answers: string[]
      score: number
      total_questions: number
      correct_answers: number
      test_type: string
    },
  ): Promise<TestResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/test/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, ...testData }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Submit test result error:", error)
      throw error
    }
  },

  // 获取测试历史
  async getTestHistory(userId: number, limit?: number): Promise<TestResult[]> {
    try {
      const params = new URLSearchParams()
      params.append("user_id", userId.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE_URL}/test/history?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get test history error:", error)
      return []
    }
  },

  // ==================== 错题本相关 ====================

  // 添加错词
  async addWrongWord(userId: number, wordId: number, userAnswer: string, errorType = "含义理解"): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/wrongwords/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          word_id: wordId,
          user_answer: userAnswer,
          error_type: errorType,
        }),
      })
    } catch (error) {
      console.error("Add wrong word error:", error)
      throw error
    }
  },

  // 获取错词列表
  async getWrongWords(userId: number): Promise<WrongWord[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/wrongwords?user_id=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get wrong words error:", error)
      return []
    }
  },

  // 删除错词
  async removeWrongWord(wrongWordId: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/wrongwords/${wrongWordId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Remove wrong word error:", error)
      throw error
    }
  },

  // ==================== 复习计划相关 ====================

  // 获取复习计划
  async getReviewSchedule(userId: number): Promise<ReviewSchedule[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/review?user_id=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get review schedule error:", error)
      return []
    }
  },

  // 更新复习计划
  async updateReviewSchedule(scheduleId: number, scheduleData: Partial<ReviewSchedule>): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/review/schedule/${scheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      })
    } catch (error) {
      console.error("Update review schedule error:", error)
      throw error
    }
  },

  // 创建复习计划
  async createReviewSchedule(userId: number, wordId: number): Promise<ReviewSchedule> {
    try {
      const response = await fetch(`${API_BASE_URL}/review/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, word_id: wordId }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Create review schedule error:", error)
      throw error
    }
  },

  // ==================== 收藏相关 ====================

  // 收藏单词
  async favoriteWord(userId: number, wordId: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/favorite/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          word_id: wordId,
        }),
      })
    } catch (error) {
      console.error("Favorite word error:", error)
      throw error
    }
  },

  // 取消收藏
  async unfavoriteWord(userId: number, wordId: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/favorite/${wordId}`, {
        method: "DELETE",
      })
    } catch (error) {
      console.error("Unfavorite word error:", error)
      throw error
    }
  },

  // 获取收藏单词列表
  async getFavoriteWords(userId: number): Promise<Word[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite?user_id=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get favorite words error:", error)
      return []
    }
  },

  // ==================== 统计分析相关 ====================

  // 获取学习统计数据
  async getStudyStatistics(userId: number): Promise<StudyStatistics> {
    try {
      const [masteryStats, categoryStats, studyLogs] = await Promise.all([
        this.getMasteryStatistics(userId),
        this.getCategoryStatistics(userId),
        this.getStudyLogs(userId)
      ])

      // Calculate total words and mastered words
      const totalWords = masteryStats?.total_words || 0
      const masteredWords = masteryStats?.mastered_words || 0

      // Calculate study days and streak
      const studyDays = Array.isArray(studyLogs) ? studyLogs.length : 0
      const streak = Array.isArray(studyLogs) ? this.calculateStreak(studyLogs) : 0

      // Calculate average accuracy
      const totalAccuracy = Array.isArray(studyLogs) 
        ? studyLogs.reduce((sum, log) => sum + (log.accuracy_rate || 0), 0) 
        : 0
      const averageAccuracy = studyDays ? totalAccuracy / studyDays : 0

      // Calculate weekly progress
      const weeklyProgress = Array.isArray(studyLogs) 
        ? this.calculateWeeklyProgress(studyLogs)
        : []

      // Calculate category progress
      const categoryProgress = Array.isArray(categoryStats)
        ? categoryStats.map(stat => ({
            category: stat.category,
            progress: stat.progress || 0
          }))
        : []

      // Calculate monthly data
      const monthlyData = Array.isArray(studyLogs)
        ? this.calculateMonthlyData(studyLogs)
        : []

      return {
        totalWords,
        masteredWords,
        studyDays,
        streak,
        averageAccuracy,
        weeklyProgress,
        categoryProgress,
        monthlyData
      }
    } catch (error) {
      console.error("Get study statistics error:", error)
      return {
        totalWords: 0,
        masteredWords: 0,
        studyDays: 0,
        streak: 0,
        averageAccuracy: 0,
        weeklyProgress: [],
        categoryProgress: [],
        monthlyData: []
      }
    }
  },

  // 获取全局统计（管理员用）
  async getGlobalStatistics(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/global`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get global statistics error:", error)
      return null
    }
  },

  // ==================== 打卡相关 ====================

  // 获取打卡记录
  async getCheckInLogs(userId: number, limit?: number): Promise<CheckInLog[]> {
    try {
      const params = new URLSearchParams()
      params.append("user_id", userId.toString())
      if (limit) params.append("limit", limit.toString())

      const response = await fetch(`${API_BASE_URL}/check-in/logs?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get check-in logs error:", error)
      return []
    }
  },

  // 今日打卡
  async checkInToday(
    userId: number,
    studyData: {
      word_count: number
      study_duration: number
      accuracy_rate: number
    },
  ): Promise<CheckInLog> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-in/today`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, ...studyData }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Check-in today error:", error)
      throw error
    }
  },

  // 获取打卡统计
  async getCheckInStats(userId: number): Promise<{
    currentStreak: number
    longestStreak: number
    totalCheckIns: number
    thisMonthCheckIns: number
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/check-in/stats?user_id=${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get check-in stats error:", error)
      throw error
    }
  },

  // ==================== 其他功能 ====================

  // 获取仪表板数据
  async getDashboardData(userId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get dashboard data error:", error)
      return null
    }
  },

  // 搜索功能（全局搜索）
  async globalSearch(
    query: string,
    type: "words" | "lists" | "users" | "all" = "all",
  ): Promise<{
    words: Word[]
    lists: WordList[]
    users: User[]
  }> {
    try {
      const params = new URLSearchParams()
      params.append("query", query)
      params.append("type", type)

      const response = await fetch(`${API_BASE_URL}/search?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Global search error:", error)
      return { words: [], lists: [], users: [] }
    }
  },

  // 导出数据
  async exportData(userId: number, type: "words" | "progress" | "all"): Promise<string> {
    try {
      const params = new URLSearchParams()
      params.append("user_id", userId.toString())
      params.append("type", type)

      const response = await fetch(`${API_BASE_URL}/export?${params}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Export data error:", error)
      throw error
    }
  },

  // 获取统计数据
  async getStatistics(userId: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/mastery/${userId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Get statistics error:", error)
      return null
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }
      return await response.json()
    } catch (error) {
      console.error("Get users error:", error)
      return []
    }
  },

  // 更新用户信息
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to update user: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("Update user error:", error)
      throw error
    }
  },

  async getMasteryStatistics(userId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/mastery/${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch mastery statistics")
      }
      return await response.json()
    } catch (error) {
      console.error("Get mastery statistics error:", error)
      return { total_words: 0, mastered_words: 0 }
    }
  },

  async getCategoryStatistics(userId: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/categories/${userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch category statistics")
      }
      return await response.json()
    } catch (error) {
      console.error("Get category statistics error:", error)
      return []
    }
  },

  calculateStreak(studyLogs: StudyLog[]): number {
    if (!studyLogs.length) return 0
    
    const dates = studyLogs.map(log => new Date(log.study_time).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    
    let streak = 1
    let currentStreak = 1
    
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1])
      const currDate = new Date(uniqueDates[i])
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        currentStreak++
        streak = Math.max(streak, currentStreak)
      } else {
        currentStreak = 1
      }
    }
    
    return streak
  },

  calculateWeeklyProgress(studyLogs: StudyLog[]) {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    
    const weeklyData = Array(7).fill(0).map((_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      return {
        date: date.toISOString().split('T')[0],
        count: 0
      }
    })
    
    studyLogs.forEach(log => {
      const logDate = new Date(log.study_time).toISOString().split('T')[0]
      const dayIndex = weeklyData.findIndex(day => day.date === logDate)
      if (dayIndex !== -1) {
        weeklyData[dayIndex].count++
      }
    })
    
    return weeklyData
  },

  calculateMonthlyData(studyLogs: StudyLog[]) {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    
    const monthlyData = Array(6).fill(0).map((_, index) => {
      const date = new Date(monthStart)
      date.setMonth(monthStart.getMonth() + index)
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        count: 0
      }
    })
    
    studyLogs.forEach(log => {
      const logDate = new Date(log.study_time)
      const monthIndex = logDate.getMonth() - monthStart.getMonth()
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].count++
      }
    })
    
    return monthlyData
  },

  // 删除用户
  async deleteUser(userId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Delete user error:", error)
      throw error
    }
  },
} 