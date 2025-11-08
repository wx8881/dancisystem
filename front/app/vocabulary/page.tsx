"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Download, Edit, Trash2, BookOpen, AlertCircle, CheckCircle } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { WordList, Word, User } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { Toaster, toast } from "react-hot-toast"

interface VocabularyManagementProps {
  currentUser: User
}

export default function VocabularyManagement({ currentUser }: VocabularyManagementProps) {
  const [selectedTab, setSelectedTab] = useState("browse")
  const [searchTerm, setSearchTerm] = useState("")
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [newListDifficulty, setNewListDifficulty] = useState("CET-4")
  const [vocabularyLists, setVocabularyLists] = useState<WordList[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [importData, setImportData] = useState<string>("")
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [importSuccess, setImportSuccess] = useState<number>(0)
  const [importError, setImportError] = useState<number>(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [viewList, setViewList] = useState<WordList | null>(null)
  const [editList, setEditList] = useState<WordList | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDifficulty, setEditDifficulty] = useState("")

  const loadVocabulary = async () => {
    try {
      const lists = await DataService.getWordLists()
      // 获取每个词表的单词
      const listsWithWords = await Promise.all(
        lists.map(async (list) => {
          const words = await DataService.getWords(list.list_id)
          return { ...list, words }
        })
      )
      setVocabularyLists(listsWithWords)
      setLoading(false)
    } catch (err) {
      setImportStatus("加载词表失败")
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVocabulary()
  }, [])

  const createNewList = async () => {
    try {
      const newList = await DataService.createWordList({
        list_name: newListName,
        description: newListDescription,
        creator_id: currentUser.user_id,
        is_public: false,
        difficulty: newListDifficulty,
      })
      setVocabularyLists([...vocabularyLists, newList])
      setNewListName("")
      setNewListDescription("")
      setShowCreateDialog(false)
    } catch (error) {
      console.error("Failed to create word list:", error)
    }
  }

  const deleteList = async (listId: number) => {
    try {
      await DataService.deleteWordList(listId)
      setVocabularyLists(vocabularyLists.filter((list) => list.list_id !== listId))
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Failed to delete word list:", error)
    }
  }

  const handleImport = async () => {
    if (!selectedList) {
      toast.error("请先选择要导入的词表")
      return
    }

    if (!importData.trim()) {
      toast.error("请输入要导入的 JSON 数据")
      return
    }

    try {
      // 验证 JSON 格式
      let words;
      try {
        const parsedData = JSON.parse(importData);
        // 如果输入是单个单词对象，转换为数组
        words = Array.isArray(parsedData) ? parsedData : [parsedData];
      } catch (e) {
        toast.error("JSON 格式不正确")
        return
      }

      // 验证数据结构
      const isValid = words.every((word: any) => {
        return (
          typeof word.word === "string" &&
          Array.isArray(word.translations) &&
          word.translations.every((t: any) => typeof t.translation === "string" && typeof t.type === "string") &&
          Array.isArray(word.phrases) &&
          word.phrases.every((p: any) => typeof p.phrase === "string" && typeof p.translation === "string")
        )
      })

      if (!isValid) {
        toast.error("JSON 数据格式不正确，请检查数据结构")
        return
      }

      // 显示导入进度对话框
      setImportStatus("开始导入...")
      setImportProgress({ current: 0, total: words.length })
      setImportSuccess(0)
      setImportError(0)

      // 分批处理，每批50个单词
      const batchSize = 50
      const totalBatches = Math.ceil(words.length / batchSize)

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize)
        const currentBatch = Math.floor(i / batchSize) + 1
        setImportStatus(`正在导入第 ${currentBatch}/${totalBatches} 批`)

        // 使用Promise.all并行处理每个批次中的单词
        const batchPromises = batch.map(async (word) => {
          try {
            const response = await fetch("http://localhost:8000/api/words", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...word,
                list_id: selectedList
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `导入单词失败: ${response.statusText}`);
            }

            setImportSuccess(prev => prev + 1)
            return true
          } catch (error) {
            console.error("导入单词失败:", error)
            setImportError(prev => prev + 1)
            return false
          } finally {
            setImportProgress(prev => ({ ...prev, current: prev.current + 1 }))
          }
        });

        // 等待当前批次完成
        await Promise.all(batchPromises)

        // 每批次完成后暂停一下，避免请求过于密集
        if (i + batchSize < words.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // 更新词表单词数
      await loadVocabulary()
      toast.success(`导入完成！成功：${importSuccess}，失败：${importError}`)
      setImportData("") // 清空输入框
    } catch (error) {
      console.error("导入失败:", error)
      toast.error("导入失败，请检查 JSON 格式是否正确")
    }
  }

  const openDeleteDialog = (listId: number) => {
    setSelectedList(listId)
    setShowDeleteDialog(true)
  }

  const handleLearn = async (word: Word) => {
    if (!word.word_id) {
      toast.error("单词ID不存在")
      return
    }
    try {
      await DataService.logStudy(currentUser.user_id, word.word_id, "known")
      toast.success("已添加到学习记录")
      // 刷新词表数据
      loadVocabulary()
    } catch (error) {
      console.error("Failed to log study:", error)
      toast.error("添加学习记录失败")
    }
  }

  const handleDownload = async (word: Word) => {
    try {
      const wordData = {
        word: word.word,
        translations: word.translations,
        phrases: word.phrases,
        list_id: word.list_id
      }
      
      const blob = new Blob([JSON.stringify(wordData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${word.word}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("下载成功")
    } catch (error) {
      console.error("Failed to download word:", error)
      toast.error("下载失败")
    }
  }

  const showImportExample = () => {
    const example = {
      "word": "example",
      "translations": [
        {
          "translation": "例子，实例",
          "type": "n."
        },
        {
          "translation": "示例，榜样",
          "type": "n."
        }
      ],
      "phrases": [
        {
          "phrase": "for example",
          "translation": "例如"
        },
        {
          "phrase": "set an example",
          "translation": "树立榜样"
        }
      ],
      "list_id": 1
    }
    setImportData(JSON.stringify(example, null, 2))
  }

  // 查看词表详情
  const handleViewList = (list: WordList) => {
    setViewList(list)
  }

  // 编辑词表
  const handleEditList = (list: WordList) => {
    setEditList(list)
    setEditName(list.list_name)
    setEditDescription(list.description)
    setEditDifficulty(list.difficulty)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editList) return
    try {
      await DataService.updateWordList(editList.list_id, {
        list_name: editName,
        description: editDescription,
        difficulty: editDifficulty,
        is_public: editList.is_public
      })
      toast.success("词表信息已更新")
      setEditList(null)
      loadVocabulary()
    } catch (e) {
      toast.error("保存失败")
    }
  }

  // 关闭查看弹窗
  const handleCloseView = () => setViewList(null)
  // 关闭编辑弹窗
  const handleCloseEdit = () => setEditList(null)

  // 删除词表按钮包装
  const handleDeleteList = (list: WordList) => {
    openDeleteDialog(list.list_id)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">词库管理</h1>
            <p className="text-muted-foreground">管理和维护词汇表</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            创建词表
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="browse">浏览词表</TabsTrigger>
            <TabsTrigger value="manage">管理词表</TabsTrigger>
            <TabsTrigger value="import">导入词表</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>搜索词表</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="搜索词表名称或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(vocabularyLists || []).map((list) => (
                <Card key={list.list_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{list.list_name}</CardTitle>
                        <CardDescription className="mt-1">{list.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{list.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>单词数量</span>
                        <span className="font-semibold">{list.word_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>创建时间</span>
                        <span>{list.create_time?.split("T")[0]}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>状态</span>
                        <Badge variant={list.is_public ? "default" : "secondary"}>
                          {list.is_public ? "公开" : "私有"}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={() => list.words?.[0] && handleLearn(list.words[0])}>
                          <BookOpen className="h-3 w-3 mr-1" />
                          学习
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => list.words?.[0] && handleDownload(list.words[0])}>
                          <Download className="h-3 w-3 mr-1" />
                          下载
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>我的词表</CardTitle>
                <CardDescription>管理您创建的词汇表</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(vocabularyLists
                    .filter((list) => !list.is_public || list.creator_id === currentUser.user_id) || [])
                    .map((list) => (
                      <div key={list.list_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <BookOpen className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold">{list.list_name}</h3>
                            <p className="text-sm text-muted-foreground">{list.description}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{list.word_count} 个单词</Badge>
                              <Badge variant={list.is_public ? "default" : "secondary"}>
                                {list.is_public ? "公开" : "私有"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewList(list)}>
                            查看
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditList(list)}>
                            编辑
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteList(list)}>
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>导入词表</CardTitle>
                <CardDescription>从JSON文件导入单词到词表</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>选择词表</Label>
                    <Select value={selectedList?.toString() || ""} onValueChange={(value) => setSelectedList(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择词表" />
                      </SelectTrigger>
                      <SelectContent>
                        {vocabularyLists
                          .filter((list) => !list.is_public || list.creator_id === currentUser.user_id)
                          .map((list) => (
                            <SelectItem key={list.list_id} value={list.list_id.toString()}>
                              {list.list_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>JSON 数据</Label>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">导入词表</h3>
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={showImportExample}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          查看示例
                        </button>
                      </div>
                      <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="请输入JSON格式的词表数据"
                        className="w-full h-48 p-2 border rounded"
                      />
                      <div className="mt-2 text-sm text-gray-500">
                        提示：可以导入单个单词或包含多个单词的数组。每个单词需要包含 word、translations 和 phrases 字段。
                      </div>
                    </div>
                  </div>

                  {importStatus && (
                    <div className="text-sm text-muted-foreground">
                      {importStatus}
                      {importProgress.total > 0 && (
                        <div className="mt-2">
                          <Progress
                            value={(importProgress.current / importProgress.total) * 100}
                            className="h-2"
                          />
                          <div className="mt-1 text-xs">
                            进度: {importProgress.current} / {importProgress.total}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button onClick={handleImport} disabled={!selectedList || !importData.trim()}>
                    <Upload className="h-4 w-4 mr-2" />
                    开始导入
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 创建词表对话框 */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>创建新词表</DialogTitle>
              <DialogDescription>创建一个新的词汇表</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="list-name">词表名称</Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="输入词表名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-description">词表描述</Label>
                <Textarea
                  id="list-description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="输入词表描述"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-difficulty">难度级别</Label>
                <Select value={newListDifficulty} onValueChange={setNewListDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择难度级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CET-4">CET-4</SelectItem>
                    <SelectItem value="CET-6">CET-6</SelectItem>
                    <SelectItem value="GRE">GRE</SelectItem>
                    <SelectItem value="TOEFL">TOEFL</SelectItem>
                    <SelectItem value="IELTS">IELTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={createNewList} disabled={!newListName.trim()}>
                创建词表
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除词表确认对话框 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>删除词表</DialogTitle>
              <DialogDescription>此操作不可撤销，确定要删除此词表吗？</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedList && (
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-md">
                  <BookOpen className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="font-semibold">
                      {vocabularyLists.find((list) => list.list_id === selectedList)?.list_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {vocabularyLists.find((list) => list.list_id === selectedList)?.description}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {vocabularyLists.find((list) => list.list_id === selectedList)?.word_count} 个单词
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={() => selectedList && deleteList(selectedList)}>
                确认删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 查看词表详情弹窗 */}
        <Dialog open={!!viewList} onOpenChange={handleCloseView}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>词表详情</DialogTitle>
              <DialogDescription>{viewList?.list_name}</DialogDescription>
            </DialogHeader>
            <div className="mb-2 text-sm text-muted-foreground">{viewList?.description}</div>
            <div className="mb-2">难度：{viewList?.difficulty}</div>
            <div className="mb-2">单词数：{viewList?.words?.length ?? 0}</div>
            <div className="max-h-64 overflow-y-auto border rounded p-2">
              {viewList?.words?.length ? (
                <ul className="space-y-2">
                  {viewList.words.map((w) => (
                    <li key={w.word_id}>
                      <div className="font-semibold">{w.word}</div>
                      <div className="text-xs text-gray-500">{w.translations.map(t => t.translation).join('；')}</div>
                      {w.phrases?.length > 0 && (
                        <div className="text-xs text-blue-500 mt-1">短语：{w.phrases.map(p => p.phrase).join('，')}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-gray-400">暂无单词</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseView}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* 编辑词表弹窗 */}
        <Dialog open={!!editList} onOpenChange={handleCloseEdit}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>编辑词表</DialogTitle>
              <DialogDescription>修改词表基本信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-list-name">词表名称</Label>
                <Input id="edit-list-name" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-list-description">词表描述</Label>
                <Textarea id="edit-list-description" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-list-difficulty">难度级别</Label>
                <Select value={editDifficulty} onValueChange={setEditDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择难度级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CET-4">CET-4</SelectItem>
                    <SelectItem value="CET-6">CET-6</SelectItem>
                    <SelectItem value="GRE">GRE</SelectItem>
                    <SelectItem value="TOEFL">TOEFL</SelectItem>
                    <SelectItem value="IELTS">IELTS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseEdit}>取消</Button>
              <Button onClick={handleSaveEdit} disabled={!editName.trim()}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
