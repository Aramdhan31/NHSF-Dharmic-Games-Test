"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, Trophy, Zap, CheckCircle } from "lucide-react"

interface GamePlayProps {
  onBack: () => void
}

export function GamePlay({ onBack }: GamePlayProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [score, setScore] = useState(450)
  const [streak, setStreak] = useState(3)

  const question = {
    text: "Which Hindu scripture is considered the oldest and contains hymns dedicated to various deities?",
    options: ["Bhagavad Gita", "Ramayana", "Rig Veda", "Mahabharata"],
    correctAnswer: 2,
  }

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, isAnswered])

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return

    setSelectedAnswer(index)
    setIsAnswered(true)

    if (index === question.correctAnswer) {
      setScore(score + 100)
      setStreak(streak + 1)
    } else {
      setStreak(0)
    }
  }

  const getAnswerStyle = (index: number) => {
    if (!isAnswered) {
      return selectedAnswer === index
        ? "bg-orange-100 border-orange-500 text-orange-700"
        : "bg-white border-gray-200 hover:bg-gray-50"
    }

    if (index === question.correctAnswer) {
      return "bg-green-100 border-green-500 text-green-700"
    }

    if (selectedAnswer === index && index !== question.correctAnswer) {
      return "bg-red-100 border-red-500 text-red-700"
    }

    return "bg-gray-100 border-gray-200 text-gray-500"
  }

  return (
    <main className="py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Game
          </Button>

          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-500 hover:bg-blue-600">London Zone Matrix</Badge>
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
              1v1 Quiz Battle
            </Badge>
          </div>
        </div>

        {/* Game Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{score}</span>
              </div>
              <p className="text-sm text-gray-600">Your Score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">{streak}</span>
              </div>
              <p className="text-sm text-gray-600">Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">{timeLeft}s</span>
              </div>
              <p className="text-sm text-gray-600">Time Left</p>
            </CardContent>
          </Card>
        </div>

        {/* Question Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Question {currentQuestion} of 10</span>
              <span className="text-sm text-gray-600">{Math.round((currentQuestion / 10) * 100)}% Complete</span>
            </div>
            <Progress value={(currentQuestion / 10) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Main Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-center">{question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`p-4 rounded-lg border-2 text-left font-medium transition-all duration-200 ${getAnswerStyle(index)}`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {String.fromCharCode(65 + index)}. {option}
                    </span>
                    {isAnswered && index === question.correctAnswer && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Answer Feedback */}
        {isAnswered && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                {selectedAnswer === question.correctAnswer ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Correct!</h3>
                    <p className="text-sm">+100 points • Streak: {streak}</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-lg">✗</span>
                    </div>
                    <h3 className="text-lg font-semibold">Incorrect</h3>
                    <p className="text-sm">The correct answer was: {question.options[question.correctAnswer]}</p>
                  </div>
                )}

                <Button
                  className="mt-4 bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    setCurrentQuestion(currentQuestion + 1)
                    setTimeLeft(30)
                    setSelectedAnswer(null)
                    setIsAnswered(false)
                  }}
                >
                  Next Question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Opponent Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Opponent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-semibold">South Zone Matrix</p>
                  <p className="text-sm text-gray-600">Priya S.</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">420</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
