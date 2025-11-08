"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, Target, Award } from "lucide-react"
import { DataService } from "@/lib/data-service"
import type { TestQuestion, User } from "@/lib/types"
import { toast } from "react-hot-toast"

// 模拟测试题目
// const testQuestions = [
//   {
//     id: 1,
//     type: "en-to-cn",
//     question: "选择单词 'abandon' 的正确含义",
//     word: "abandon",
//     answer: "放弃",
//     options: ["放弃", "能力", "抽象", "加速"],
//   },
//   {
//     id: 2,
//     type: "cn-to-en",
//     question: "选择中文 '能力' 对应的英文单词",
//     answer: "ability",
//     options: ["ability", "abandon", "abstract", "accelerate"],
//   },
//   {
//     id: 3,
//     type: "en-to-cn",
//     question: "选择单词 'abstract' 的正确含义",
//     word: "abstract",
//     answer: "抽象的",
//     options: ["抽象的", "具体的", "简单的", "复杂的"],
//   },
//   {
//     id: 4,
//     type: "cn-to-en",
//     question: "选择中文 '加速' 对应的英文单词",
//     answer: "accelerate",
//     options: ["accelerate", "accommodate", "abandon", "ability"],
//   },
//   {
//     id: 5,
//     type: "en-to-cn",
//     question: "选择单词 'accommodate' 的正确含义",
//     word: "accommodate",
//     answer: "容纳",
//     options: ["容纳", "拒绝", "忽略", "避免"],
//   },
// ]

interface TestModuleProps {
  currentUser: User
}

export default function TestModule({ currentUser }: TestModuleProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5分钟 = 300秒
  const [timerActive, setTimerActive] = useState(false);

  // 加载测试题目
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/test/questions?count=5");
        if (!response.ok) {
          throw new Error('获取测试题目失败');
        }
        const data = await response.json();
        // 转换后端数据为前端格式
        const formattedQuestions = data.map((q: any) => ({
          id: q.word_id,
          type: "en-to-cn",
          question: `选择单词 '${q.word}' 的正确含义`,
          word: q.word,
          answer: q.translations[0].translation,
          options: q.translations.map((t: any) => t.translation)
        }));
        setQuestions(formattedQuestions);
        setUserAnswers(new Array(formattedQuestions.length).fill(''));
        setLoading(false);
        setTimerActive(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载测试题目失败');
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    setShowResults(true);
    // 提交测试结果
    try {
      // 准备测试结果数据
      const testResult = {
        user_id: currentUser.user_id,
        questions: questions.map(q => ({
          word_id: q.id,
          question: q.question,
          correct_answer: q.answer
        })),
        answers: userAnswers,
        score: calculateScore(),
        total_questions: questions.length,
        correct_answers: calculateScore(),
        test_type: "quick"
      };

      const response = await fetch("http://localhost:8000/api/tests/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testResult),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = '提交测试结果失败';
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map((item: any) =>
            typeof item === 'string'
              ? item
              : (item.msg || item.detail || JSON.stringify(item))
          ).join('; ');
        } else if (typeof errorData.detail === 'object') {
          errorMsg = errorData.detail.msg || errorData.detail.detail || JSON.stringify(errorData.detail);
        } else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        }
        throw new Error(errorMsg);
      }

      // 对于每个错误的答案，添加到错题本
      for (let i = 0; i < questions.length; i++) {
        if (userAnswers[i] !== questions[i].answer) {
          try {
            const wrongWordResponse = await fetch("http://localhost:8000/api/wrongwords/add", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: currentUser.user_id,
                word_id: questions[i].id,
                user_answer: userAnswers[i],
                error_type: "测试错误"
              }),
            });

            if (!wrongWordResponse.ok) {
              console.error(`Failed to add wrong word ${questions[i].word} to error book`);
            }
          } catch (error) {
            console.error("Failed to add wrong word:", error);
          }
        }
      }

      toast.success("测试结果已提交");
    } catch (error) {
      console.error("Failed to submit test result:", error);
      toast.error("提交测试结果失败");
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) {
        correct++;
      }
    });
    return correct;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">测试结果</h1>
          <p className="text-muted-foreground">您的词汇测试已完成</p>
        </div>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-blue-600">{percentage}分</CardTitle>
            <CardDescription>
              {percentage >= 90 && "优秀！您的词汇掌握得很好"}
              {percentage >= 80 && percentage < 90 && "良好！继续保持"}
              {percentage >= 70 && percentage < 80 && "及格，还有提升空间"}
              {percentage < 70 && "需要加强练习"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-2xl font-bold text-green-600">{score}</div>
                <div className="text-sm text-muted-foreground">正确</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{questions.length - score}</div>
                <div className="text-sm text-muted-foreground">错误</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{questions.length}</div>
                <div className="text-sm text-muted-foreground">总题数</div>
              </div>
            </div>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()}>重新测试</Button>
              <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                返回
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>答题详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((q, index) => {
                const isCorrect = userAnswers[index]?.toLowerCase().trim() === q.answer.toLowerCase().trim();
                return (
                  <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{q.question}</div>
                        <div className="text-sm text-muted-foreground">
                          您的答案: {userAnswers[index] || "未答"} | 正确答案: {q.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">单词测试进行中</h1>
          <p className="text-muted-foreground">
            第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{formatTime(timeLeft)}</div>
          <div className="text-sm text-muted-foreground">剩余时间</div>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="min-h-96">
        <CardHeader>
          <div className="flex justify-between items-center">
            <Badge variant="outline">第 {currentQuestionIndex + 1} 题</Badge>
            <Badge variant="secondary">{currentQuestion?.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{currentQuestion?.question}</h2>
          </div>

          <RadioGroup value={userAnswers[currentQuestionIndex]} onValueChange={handleAnswer}>
            <div className="space-y-3">
              {(currentQuestion?.options || []).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-lg">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              上一题
            </Button>
            {currentQuestionIndex === questions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={!userAnswers[currentQuestionIndex]}>
                提交
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!userAnswers[currentQuestionIndex]}>
                下一题
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
