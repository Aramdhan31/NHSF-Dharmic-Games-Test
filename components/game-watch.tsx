"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Clock, Trophy } from "lucide-react"

interface GameWatchProps {
  onBack: () => void
}

export function GameWatch({ onBack }: GameWatchProps) {
  const [timeLeft, setTimeLeft] = useState(332) // 5:32 in seconds
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const teams = [
    { name: "London Zone Matrix", score: 750, color: "bg-blue-500", players: ["Arjun P.", "Meera S."] },
    { name: "South Zone Matrix", score: 680, color: "bg-green-500", players: ["Priya S.", "Raj K."] },
  ]

  return (
    <main className="py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>

          <div className="flex items-center space-x-4">
            <Badge className="bg-red-500 hover:bg-red-600">🔴 LIVE</Badge>
            <div className="flex items-center space-x-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span>23 watching</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Game View */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>1v1 Quiz Battle</CardTitle>
                  <div className="flex items-center space-x-2 text-lg font-mono">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-600 font-bold">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-sm text-gray-600 mb-2">
                    Question {currentQuestion} of {totalQuestions}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Which Hindu festival is known as the "Festival of Lights"?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Diwali", "Holi", "Navratri", "Dussehra"].map((option, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white rounded-lg border border-gray-200 text-center font-medium"
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center text-gray-600">
                  <p>Players are answering...</p>
                  <div className="flex justify-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  <span>Live Scores</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {teams.map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${team.color}`}></div>
                      <div>
                        <p className="font-semibold text-sm">{team.name}</p>
                        <p className="text-xs text-gray-600">{team.players.join(", ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{team.score}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Game Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Game Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered</span>
                  <span className="font-semibold">
                    {currentQuestion - 1}/{totalQuestions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Response Time</span>
                  <span className="font-semibold">3.2s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answers</span>
                  <span className="font-semibold">85%</span>
                </div>
              </CardContent>
            </Card>

            {/* Chat/Comments */}
            <Card>
              <CardHeader>
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-semibold text-blue-600">Viewer23:</span> Great question!
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-semibold text-green-600">TeamLZ:</span> Come on London! 💪
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="font-semibold text-purple-600">Admin:</span> Next question coming up...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
