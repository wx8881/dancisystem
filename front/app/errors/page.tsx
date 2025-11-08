"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RotateCcw, Trash2, BookOpen, TrendingDown } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { WrongWord, User } from "@/lib/types"

interface ErrorBookProps {
  currentUser: User
}

export default function ErrorBook({ currentUser }: ErrorBookProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("errorCount")
  const [errorWords, setErrorWords] = useState<WrongWord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWrongWords = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const data = await DataService.getWrongWords(currentUser.user_id);
        // 去重处理：保留每个单词最新的错题记录
        const uniqueWords = data.reduce((acc: WrongWord[], current) => {
          const existingWord = acc.find(item => item.word_id === current.word_id);
          if (!existingWord) {
            acc.push(current);
          } else {
            // 如果已存在，比较时间戳，保留最新的记录
            const existingTime = new Date(existingWord.last_wrong_time).getTime();
            const currentTime = new Date(current.last_wrong_time).getTime();
            if (currentTime > existingTime) {
              // 替换旧记录
              const index = acc.findIndex(item => item.word_id === current.word_id);
              acc[index] = current;
            }
          }
          return acc;
        }, []);
        setErrorWords(uniqueWords);
      } catch (error) {
        console.error('获取错题失败:', error);
        setError('获取错题失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchWrongWords();
  }, [currentUser]);

  const filteredWords = errorWords
    .filter(
      (word) =>
        word.word?.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.word?.translations.some((t) => t.translation.includes(searchTerm)),
    )
    .filter((word) => selectedCategory === "all" || word.word?.difficulty === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "errorCount") return b.wrong_count - a.wrong_count
      if (sortBy === "lastError") return new Date(b.last_wrong_time).getTime() - new Date(a.last_wrong_time).getTime()
      return (a.word?.word || "").localeCompare(b.word?.word || "")
    })

  const removeFromErrorBook = async (id: number) => {
    try {
      await DataService.removeWrongWord(id)
      setErrorWords(errorWords.filter((word) => word.id !== id))
    } catch (error) {
      console.error("Failed to remove wrong word:", error)
    }
  }

  const markAsMastered = async (wordId: number) => {
    try {
      await DataService.logStudy(currentUser.user_id, wordId, "known")
      setErrorWords(errorWords.filter((word) => word.word_id !== wordId))
    } catch (error) {
      console.error("Failed to mark word as mastered:", error)
    }
  }

  const startReview = () => {
    // 模拟开始复习
    console.log("Start reviewing error words")
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">错题本</h1>
          <p className="text-muted-foreground">回顾和复习您的错误单词</p>
        </div>
        <Button onClick={startReview}>
          <BookOpen className="h-4 w-4 mr-2" />
          开始复习
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">错题总数</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorWords.length}</div>
            <p className="text-xs text-muted-foreground">需要重点复习</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高频错词</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorWords.filter((word) => word.wrong_count >= 3).length}</div>
            <p className="text-xs text-muted-foreground">错误3次以上</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">含义错误</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {errorWords.filter((word) => word.error_type === "含义理解").length}
            </div>
            <p className="text-xs text-muted-foreground">理解类错误</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索单词或含义..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">全部难度</option>
                <option value="CET-4">CET-4</option>
                <option value="CET-6">CET-6</option>
                <option value="GRE">GRE</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="errorCount">按错误次数</option>
                <option value="lastError">按最近错误</option>
                <option value="alphabetical">按字母顺序</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错题列表 */}
      <div className="space-y-4">
        {filteredWords.map((wrongWord) => (
          <Card key={wrongWord.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{wrongWord.word?.word}</h3>
                  <Badge variant="outline">{wrongWord.word?.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">错误 {wrongWord.wrong_count} 次</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeFromErrorBook(wrongWord.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">词性和含义</div>
                    <div className="space-y-1">
                      {(wrongWord.word?.translations || []).map((trans, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {trans.type}
                          </Badge>
                          <span className="text-lg">{trans.translation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">常用短语</div>
                    <div className="space-y-1">
                      {(wrongWord.word?.phrases?.slice(0, 2) || []).map((phrase, index) => (
                        <div key={index}>
                          <div className="font-medium">{phrase.phrase}</div>
                          <div className="text-sm text-muted-foreground">{phrase.translation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">错误类型</div>
                    <Badge variant="outline">{wrongWord.error_type}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">您的答案</div>
                    <div className="text-lg text-red-600 line-through">{wrongWord.user_answer}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">正确答案</div>
                    <div className="text-lg text-green-600">{wrongWord.word?.translations[0]?.translation}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">最近错误时间</div>
                    <div className="text-lg">{new Date(wrongWord.last_wrong_time).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => wrongWord.word_id && markAsMastered(wrongWord.word_id)}
                  >
                    标记已掌握
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">没有找到错题</h3>
            <p className="text-muted-foreground">{searchTerm ? "尝试调整搜索条件" : "恭喜！您还没有错题记录"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
