"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RotateCcw, CheckCircle, XCircle, Eye, EyeOff, Heart, Volume2 } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { Word, User } from "@/lib/types"

interface StudyModuleProps {
  currentUser: User
}

export default function StudyModule({ currentUser }: StudyModuleProps) {
  const [vocabularyData, setVocabularyData] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [studiedWords, setStudiedWords] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [favoriteWords, setFavoriteWords] = useState<number[]>([])
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadWords = async () => {
      try {
        const words = await DataService.getWords(1, 10) // 加载前10个单词
        setVocabularyData(words)
        
        // 加载收藏的单词
        const favorites = await DataService.getFavoriteWords(currentUser.user_id)
        setFavoriteWords(favorites.map((word: Word) => word.word_id || 0))
      } catch (error) {
        console.error("Failed to load words:", error)
      } finally {
        setLoading(false)
      }
    }
    loadWords()
  }, [currentUser.user_id])

  useEffect(() => {
    // 检查当前单词是否已收藏
    if (vocabularyData.length > 0 && currentWordIndex < vocabularyData.length) {
      const currentWordId = vocabularyData[currentWordIndex].word_id
      setIsFavorite(currentWordId ? favoriteWords.includes(currentWordId) : false)
    }
  }, [currentWordIndex, vocabularyData, favoriteWords])

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  if (vocabularyData.length === 0) {
    return <div className="flex justify-center items-center h-64">暂无词汇数据</div>
  }

  const currentWord = vocabularyData[currentWordIndex]
  const progress = (studiedWords / vocabularyData.length) * 100

  const handleAnswer = async (known: boolean) => {
    // 记录学习日志
    if (currentWord.word_id) {
      await DataService.logStudy(
        currentUser.user_id,
        currentWord.word_id,
        known ? "known" : "unknown"
      )
    }

    if (known) {
      setCorrectAnswers((prev) => prev + 1)
    }
    setStudiedWords((prev) => prev + 1)
    nextWord()
  }

  const handleSpellingTest = async () => {
    const correct = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase()
    setIsCorrect(correct)
    setShowResult(true)
    
    // 记录学习日志
    if (currentWord.word_id) {
      await DataService.logStudy(
        currentUser.user_id,
        currentWord.word_id,
        correct ? "known" : "unknown"
      )
      
      // 如果答错了，添加到错题本
      if (!correct) {
        await DataService.addWrongWord(
          currentUser.user_id,
          currentWord.word_id,
          userAnswer,
          "拼写错误"
        )
      }
    }
    
    if (correct) {
      setCorrectAnswers((prev) => prev + 1)
    }
    setStudiedWords((prev) => prev + 1)
  }

  const nextWord = () => {
    setShowMeaning(false)
    setUserAnswer("")
    setShowResult(false)
    setCurrentWordIndex((prev) => (prev + 1) % vocabularyData.length)
  }

  const playPronunciation = () => {
    // 模拟发音功能
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word)
      utterance.lang = "en-US"
      speechSynthesis.speak(utterance)
    }
  }

  const toggleFavorite = async () => {
    if (!currentWord.word_id) return
    
    try {
      if (isFavorite) {
        await DataService.unfavoriteWord(currentUser.user_id, currentWord.word_id)
        setFavoriteWords(favoriteWords.filter(id => id !== currentWord.word_id))
      } else {
        await DataService.favoriteWord(currentUser.user_id, currentWord.word_id)
        setFavoriteWords([...favoriteWords, currentWord.word_id])
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">背单词</h1>
          <p className="text-muted-foreground">智能单词学习模式</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {studiedWords}/{vocabularyData.length}
          </div>
          <div className="text-sm text-muted-foreground">
            正确率: {studiedWords > 0 ? Math.round((correctAnswers / studiedWords) * 100) : 0}%
          </div>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主学习卡片 */}
        <div className="lg:col-span-2">
          <Card className="h-96">
            <CardHeader>
              <div className="flex justify-between items-center">
                {/* <Badge variant="outline">{currentWord.difficulty}</Badge> */}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={playPronunciation}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-red-500 hover:text-red-600" : ""}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-2">{currentWord.word}</h2>
                <div className="mb-4">
                  {currentWord?.translations?.map((trans, index) => (
                    <div key={index} className="flex items-center justify-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {trans.type}
                      </Badge>
                      <span className="text-lg text-muted-foreground">{trans.translation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {showMeaning && (
                <div className="text-center space-y-3 animate-in fade-in-50">
                  <div>
                    <h4 className="font-semibold mb-2">常用短语</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentWord?.phrases?.slice(0, 3)?.map((phrase, index) => (
                        <div key={index} className="text-left">
                          <p className="font-medium">{phrase.phrase}</p>
                          <p className="text-muted-foreground text-sm">{phrase.translation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => setShowMeaning(!showMeaning)}>
                  {showMeaning ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showMeaning ? "隐藏释义" : "显示释义"}
                </Button>
                <Button variant="ghost" onClick={nextWord}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  跳过
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 学习操作 */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">认识程度</CardTitle>
                <CardDescription>根据您的掌握情况选择</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline" onClick={() => handleAnswer(true)}>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  认识
                </Button>
                <Button className="w-full" variant="outline" onClick={() => handleAnswer(false)}>
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  不认识
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">拼写测试</CardTitle>
                <CardDescription>输入单词拼写</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="请输入单词拼写"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSpellingTest()}
                />
                <Button className="w-full" onClick={handleSpellingTest} disabled={!userAnswer.trim()}>
                  检查拼写
                </Button>
                {showResult && (
                  <div
                    className={`text-center p-2 rounded ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {isCorrect ? "✓ 拼写正确！" : `✗ 正确拼写：${currentWord.word}`}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">学习进度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>已学习</span>
                <span className="font-semibold">{studiedWords}</span>
              </div>
              <div className="flex justify-between">
                <span>正确数</span>
                <span className="font-semibold text-green-600">{correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span>错误数</span>
                <span className="font-semibold text-red-600">{studiedWords - correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span>正确率</span>
                <span className="font-semibold">
                  {studiedWords > 0 ? Math.round((correctAnswers / studiedWords) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
