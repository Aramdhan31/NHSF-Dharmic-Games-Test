"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { GameWatch } from "@/components/game-watch"
import { GamePlay } from "@/components/game-play"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Eye, Clock, Lock } from "lucide-react"
import Link from "next/link"

type GameMode = "lobby" | "watch" | "play"

export default function GamePage() {
  const [currentMode, setCurrentMode] = useState<GameMode>("lobby")
  const [userTeam] = useState("") // Empty - no team assigned yet

  if (currentMode === "watch") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <GameWatch onBack={() => setCurrentMode("lobby")} />
        <Footer />
      </div>
    )
  }

  if (currentMode === "play") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <GamePlay onBack={() => setCurrentMode("lobby")} />
        <Footer />
      </div>
    )
  }

  const activeGames = [
    {
      id: 1,
      teams: ["London Zone", "South Zone"],
      mode: "Hindu Festivals Quiz",
      status: "live",
      viewers: 23,
      timeLeft: "5:32",
      canJoin: userTeam === "LZ" || userTeam === "SZ",
    },
    {
      id: 2,
      teams: ["North Zone", "Central Zone"],
      mode: "Bhagavad Gita Challenge",
      status: "waiting",
      viewers: 15,
      timeLeft: "Waiting for players...",
      canJoin: userTeam === "NZ" || userTeam === "CZ",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />

      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">Game Center</h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0 mb-4">
              Welcome to the NHSF (UK) Dharmic Games! Watch live games or join when your team is called to play.
            </p>
            <Badge className="bg-blue-500 hover:bg-blue-600 text-sm">
              You're representing:{" "}
              {userTeam === "LZ"
                ? "London Zone"
                : userTeam === "SZ"
                  ? "South Zone"
                  : userTeam === "NZ"
                    ? "North Zone"
                    : "Central Zone"}
            </Badge>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Active Games</h2>

            {activeGames.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Games</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6">
                    Waiting for admins to start the next competition round.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Games are started by NHSF (UK) admins during scheduled competition times.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeGames.map((game) => (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <CardTitle className="text-base sm:text-lg">{game.teams.join(" vs ")}</CardTitle>
                          <p className="text-sm sm:text-base text-gray-600">{game.mode}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={game.status === "live" ? "default" : "secondary"}
                            className={
                              game.status === "live"
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-yellow-500 hover:bg-yellow-600"
                            }
                          >
                            {game.status === "live" ? "🔴 LIVE" : "⏳ Waiting"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{game.viewers} watching</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{game.timeLeft}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMode("watch")}
                            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50 flex-1 sm:flex-none h-10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Watch
                          </Button>
                          {game.canJoin ? (
                            <Button
                              size="sm"
                              onClick={() => setCurrentMode("play")}
                              className="bg-orange-600 hover:bg-orange-700 flex-1 sm:flex-none h-10"
                              disabled={game.status !== "live"}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              {game.status === "live" ? "Join" : "Wait..."}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled
                              variant="outline"
                              className="bg-gray-100 text-gray-400 border-gray-200 flex-1 sm:flex-none h-10"
                            >
                              Not Your Team
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* How Games Work - Mobile optimized */}
            <Card className="mt-6 sm:mt-8">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">How Games Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                      1
                    </div>
                    <h4 className="font-semibold mb-1">Admin Starts Game</h4>
                    <p className="text-gray-600">NHSF (UK) admins create and launch games during competition times</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                      2
                    </div>
                    <h4 className="font-semibold mb-1">Teams Join</h4>
                    <p className="text-gray-600">Only players from the selected teams can join the game</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                      3
                    </div>
                    <h4 className="font-semibold mb-1">Everyone Can Watch</h4>
                    <p className="text-gray-600">All NATCOM members can watch any game live</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
