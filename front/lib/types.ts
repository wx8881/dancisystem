// 数据类型定义
export interface WordTranslation {
  translation: string
  type: string // n, v, adj, adv, prep, etc.
}

export interface WordPhrase {
  phrase: string
  translation: string
}

export interface Word {
  word_id?: number
  word: string
  translations: WordTranslation[]
  phrases: WordPhrase[]
  difficulty?: string
  list_id?: number
}

export interface WordList {
  list_id: number
  list_name: string
  description?: string
  creator_id?: number
  create_time?: string
  is_public?: boolean
  difficulty?: string
  word_count?: number
  words?: Word[]
}

export interface User {
  user_id: number
  username: string
  role: "student" | "teacher" | "admin"
  email?: string
  create_time?: string
}

export interface UserWithStats extends User {
  avatar?: string
  joinDate: string
  lastActive: string
  wordsLearned: number
  streak: number
  status: "active" | "inactive"
}

export interface StudyLog {
  log_id: number
  user_id: number
  word_id: number
  study_time: string
  status: "known" | "unknown" | "learning"
  word_count?: number
  accuracy_rate?: number
}

export interface ReviewSchedule {
  schedule_id: number
  user_id: number
  word_id: number
  review_date: string
  repeat_count: number
  memory_strength?: number
}

export interface WrongWord {
  id: number
  user_id: number
  word_id: number
  wrong_count: number
  last_wrong_time: string
  error_type: string
  user_answer?: string
  word?: Word
  correct_answer?: string
}

export interface CheckInLog {
  checkin_id: number
  user_id: number
  checkin_date: string
  word_count: number
  study_duration: number
  accuracy_rate: number
}

export interface TestQuestion {
  id: number
  type: "en-to-cn" | "cn-to-en"
  question: string
  word?: string
  answer: string
  options: string[]
  difficulty?: string
}

export interface TestResult {
  test_id: number
  user_id: number
  score: number
  total_questions: number
  correct_answers: number
  test_date: string
  test_type: string
}

export interface StudySession {
  session_id: number
  user_id: number
  start_time: string
  end_time: string
  words_studied: number
  accuracy_rate: number
}

export interface FavoriteWord {
  fav_id: number
  user_id: number
  word_id: number
  fav_time: string
  word?: Word
}

export interface SystemSettings {
  systemName: string
  version: string
  maxUsersPerList: number
  maxWordsPerList: number
  defaultDifficulty: string
  enableRegistration: boolean
  enablePublicLists: boolean
  maintenanceMode: boolean
}

export interface GlobalStatistics {
  totalUsers: number
  totalWords: number
  totalWordLists: number
  activeUsers: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  averageStudyTime: number
  averageAccuracy: number
  popularWords: Word[]
  recentActivity: Array<{
    type: string
    count: number
    date: string
  }>
}

export interface DashboardData {
  todayStudied: number
  totalWords: number
  masteredWords: number
  streak: number
  accuracy: number
  todayReview: number
  weeklyGoal: number
  weeklyProgress: number
  recentWords: Array<{
    word_id: number
    word: string
  }>
  upcomingReviews: Array<{
    word: string
    type: string
    count: number
  }>
}

export interface StudyStatistics {
  totalWords: number
  masteredWords: number
  studyDays: number
  streak: number
  averageAccuracy: number
  weeklyProgress: { date: string; count: number }[]
  categoryProgress: { category: string; progress: number }[]
  monthlyData: { month: string; count: number }[]
}

export interface SearchResults {
  words: Word[]
  lists: WordList[]
  users: User[]
}
