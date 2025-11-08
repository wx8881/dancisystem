"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataService } from "@/lib/data-service"
import type { WordList, Word, User } from "@/lib/types"
import { toast } from "react-hot-toast"

interface LearnModuleProps {
  currentUser: User
}

export default function LearnModule({ currentUser }: LearnModuleProps) {
  const [wordLists, setWordLists] = useState<WordList[]>([])
  const [currentList, setCurrentList] = useState<WordList | null>(null)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [showPhrases, setShowPhrases] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWordLists()
  }, [])

  const loadWordLists = async () => {
    try {
      const lists = await DataService.getWordLists(currentUser.user_id)
      setWordLists(lists)
      setLoading(false)
    } catch (error) {
      console.error("Failed to load word lists:", error)
      setLoading(false)
    }
  }

  const handleSelectList = async (list: WordList) => {
    setCurrentList(list)
    try {
      const words = await DataService.getWords(list.list_id)
      if (words.length > 0) {
        setCurrentWord(words[0])
        setShowTranslation(false)
        setShowPhrases(false)
      }
    } catch (error) {
      console.error("Failed to load words:", error)
    }
  }

  const handleKnown = async () => {
    if (!currentWord?.word_id) return
    try {
      await DataService.logStudy(currentUser.user_id, currentWord.word_id, "known")
      toast.success("已记录为已掌握")
      loadNextWord()
    } catch (error) {
      console.error("Failed to log study:", error)
      toast.error("记录失败")
    }
  }

  const handleUnknown = async () => {
    if (!currentWord?.word_id) return
    try {
      await DataService.logStudy(currentUser.user_id, currentWord.word_id, "unknown")
      toast.success("已记录为未掌握")
      loadNextWord()
    } catch (error) {
      console.error("Failed to log study:", error)
      toast.error("记录失败")
    }
  }

  const loadNextWord = async () => {
    if (!currentList?.list_id) return
    try {
      const words = await DataService.getWords(currentList.list_id)
      const currentIndex = words.findIndex(w => w.word_id === currentWord?.word_id)
      const nextWord = words[(currentIndex + 1) % words.length]
      setCurrentWord(nextWord)
      setShowTranslation(false)
      setShowPhrases(false)
    } catch (error) {
      console.error("Failed to load next word:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">单词学习</CardTitle>
            <CardDescription className="text-center">
              当前词表：{currentList?.list_name || "未选择词表"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentWord ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-4xl font-bold mb-2">{currentWord.word}</h2>
                  {showTranslation && (
                    <div className="space-y-2">
                      {currentWord.translations.map((trans, index) => (
                        <div key={index} className="text-lg">
                          <span className="text-muted-foreground">{trans.type}</span> {trans.translation}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showPhrases && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">常用短语</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {currentWord.phrases.map((phrase, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium">{phrase.phrase}</div>
                          <div className="text-sm text-muted-foreground">{phrase.translation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowTranslation(!showTranslation)}
                  >
                    {showTranslation ? "隐藏释义" : "显示释义"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPhrases(!showPhrases)}
                  >
                    {showPhrases ? "隐藏短语" : "显示短语"}
                  </Button>
                  <Button onClick={handleKnown}>认识</Button>
                  <Button variant="destructive" onClick={handleUnknown}>不认识</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">请先选择一个词表开始学习</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>词表选择</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wordLists.map((list) => (
                <Card
                  key={list.list_id}
                  className={`cursor-pointer transition-colors ${
                    currentList?.list_id === list.list_id
                      ? "border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectList(list)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{list.list_name}</CardTitle>
                    <CardDescription>
                      {list.description || "暂无描述"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">
                        {list.difficulty || "未设置难度"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {list.word_count || 0} 个单词
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 