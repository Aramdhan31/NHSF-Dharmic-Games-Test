"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RealtimeResults } from "@/components/realtime-results"
import { LiveDualZoneLeaderboard } from "@/components/live-dual-zone-leaderboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Trophy, Users, Target, TrendingUp } from "lucide-react"
import { useState } from "react"

export default function LiveResultsPage() {
  const [selectedZone, setSelectedZone] = useState<string>("all")

  const zones = [
    { value: "all", label: "All Zones" },
    { value: "LZ+SZ", label: "London & South Zone" },
    { value: "NZ+CZ", label: "North & Central Zone" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Play className="w-8 h-8 text-green-500" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                Live Results
              </h1>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                LIVE
              </Badge>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Watch live scores, matches, and leaderboards in real-time. No login required!
            </p>
          </div>

          {/* Zone Selector */}
          <div className="flex justify-center mb-8">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <Target className="w-5 h-5 text-gray-600" />
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select zone to view" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Results */}
          <div className="space-y-6">
            {selectedZone === "all" ? (
              <LiveDualZoneLeaderboard showPlayoffs={false} />
            ) : (
              <RealtimeResults 
                zone={selectedZone}
                showLiveMatches={true}
                showLeaderboard={true}
                showAnalytics={true}
              />
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-green-600">Live Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Watch matches happening right now across all zones
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-blue-600">Live Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Real-time rankings and scores updated instantly
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-purple-600">Live Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Statistics and insights updated in real-time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    Live results are updated automatically. No login required to view scores and matches.
                  </span>
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
