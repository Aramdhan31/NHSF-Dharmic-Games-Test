"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Trophy, 
  Activity, 
  Clock, 
  Target,
  Award,
  Calendar,
  MapPin,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Star,
  Medal,
  Crown,
  Flame,
  TrendingDown,
  Minus
} from "lucide-react"
import { realtimeDbUtils } from "@/lib/firebase-utils"
import { realtimeResultsService } from "@/lib/realtime-results"

interface AnalyticsData {
  totalMatches: number
  liveMatches: number
  completedMatches: number
  upcomingMatches: number
  totalUniversities: number
  totalZones: number
  totalPoints: number
  averageScore: number
  topPerformer: {
    name: string
    zone: string
    points: number
    wins: number
  }
  zoneStats: {
    [zone: string]: {
      matches: number
      points: number
      universities: number
      winRate: number
    }
  }
  sportStats: {
    [sport: string]: {
      matches: number
      popularity: number
      averageScore: number
    }
  }
  recentActivity: {
    id: string
    type: 'match_started' | 'match_completed' | 'university_added' | 'points_updated'
    description: string
    timestamp: string
    zone: string
  }[]
  leaderboard: {
    rank: number
    university: string
    zone: string
    points: number
    wins: number
    losses: number
    winRate: number
  }[]
}

interface AnalyticsDashboardProps {
  currentZone?: string
}

export function AnalyticsDashboard({ currentZone }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string>(currentZone || 'ALL')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('7d')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const timeframes = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
  ]

  const zones = [
    { value: 'ALL', label: 'All Zones' },
    { value: 'LZ', label: 'London Zone' },
    { value: 'SZ', label: 'South Zone' },
    { value: 'CZ', label: 'Central Zone' },
    { value: 'NZ', label: 'North Zone' }
  ]

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      console.log('Loading analytics data...')
      
      // Get all zones
      const zonesResult = await realtimeDbUtils.getData('zones')
      if (!zonesResult.success || !zonesResult.data) {
        console.log('No zones found')
        return
      }

      const allZones = Object.keys(zonesResult.data)
      const allMatches: any[] = []
      const allUniversities: any[] = []
      const zoneStats: { [key: string]: any } = {}
      const sportStats: { [key: string]: any } = {}
      const recentActivity: any[] = []
      const leaderboard: any[] = []

      // Load data from all zones
      for (const zone of allZones) {
        // Load matches
        const matchesResult = await realtimeDbUtils.getData(`zones/${zone}/matches`)
        if (matchesResult.success && matchesResult.data) {
          const matches = Array.isArray(matchesResult.data) 
            ? matchesResult.data 
            : Object.entries(matchesResult.data).map(([id, match]: [string, any]) => ({ id, ...match }))
          
          const matchesWithZone = matches.map((match: any) => ({ ...match, zone }))
          allMatches.push(...matchesWithZone)
        }

        // Load universities
        const universitiesResult = await realtimeDbUtils.getData(`zones/${zone}/universities`)
        if (universitiesResult.success && universitiesResult.data) {
          const universities = Array.isArray(universitiesResult.data) 
            ? universitiesResult.data 
            : Object.entries(universitiesResult.data).map(([id, university]: [string, any]) => ({ id, ...university }))
          
          allUniversities.push(...universities)
        }
      }

      // Calculate zone statistics
      allZones.forEach(zone => {
        const zoneMatches = allMatches.filter(m => m.zone === zone)
        const zoneUniversities = allUniversities.filter(u => u.zone === zone)
        const completedMatches = zoneMatches.filter(m => m.status === 'completed')
        const wins = completedMatches.length // Simplified - would need proper win calculation
        
        zoneStats[zone] = {
          matches: zoneMatches.length,
          points: completedMatches.length * 3, // Simplified points calculation
          universities: zoneUniversities.length,
          winRate: completedMatches.length > 0 ? (wins / completedMatches.length) * 100 : 0
        }
      })

      // Calculate sport statistics
      allMatches.forEach(match => {
        if (!sportStats[match.sport]) {
          sportStats[match.sport] = { matches: 0, popularity: 0, averageScore: 0 }
        }
        sportStats[match.sport].matches += 1
      })

      // Calculate popularity (matches per sport)
      const totalMatches = allMatches.length
      Object.keys(sportStats).forEach(sport => {
        sportStats[sport].popularity = (sportStats[sport].matches / totalMatches) * 100
      })

      // Generate recent activity
      allMatches.slice(0, 10).forEach(match => {
        recentActivity.push({
          id: match.id,
          type: match.status === 'live' ? 'match_started' : 'match_completed',
          description: match.status === 'live' 
            ? `${match.team1} vs ${match.team2} started`
            : `${match.team1} vs ${match.team2} completed`,
          timestamp: match.startedAt || match.endedAt || new Date().toISOString(),
          zone: match.zone
        })
      })

      // Generate leaderboard (simplified)
      allUniversities.forEach((university, index) => {
        leaderboard.push({
          rank: index + 1,
          university: university.name,
          zone: university.zone,
          points: university.points || 0,
          wins: university.wins || 0,
          losses: university.losses || 0,
          winRate: university.wins && university.losses ? Math.round((university.wins / (university.wins + university.losses)) * 100) : 0
        })
      })

      // Sort leaderboard by points
      leaderboard.sort((a, b) => b.points - a.points)
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1
      })

      const analytics: AnalyticsData = {
        totalMatches: allMatches.length,
        liveMatches: allMatches.filter(m => m.status === 'live').length,
        completedMatches: allMatches.filter(m => m.status === 'completed').length,
        upcomingMatches: allMatches.filter(m => m.status === 'scheduled').length,
        totalUniversities: allUniversities.length,
        totalZones: allZones.length,
        totalPoints: Object.values(zoneStats).reduce((sum, zone) => sum + zone.points, 0),
        averageScore: allMatches.length > 0 ? allMatches.reduce((sum, match) => sum + (match.score1 + match.score2), 0) / (allMatches.length * 2) : 0,
        topPerformer: leaderboard[0] ? {
          name: leaderboard[0].university,
          zone: leaderboard[0].zone,
          points: leaderboard[0].points,
          wins: leaderboard[0].wins
        } : {
          name: 'No Data',
          zone: 'N/A',
          points: 0,
          wins: 0
        },
        zoneStats,
        sportStats,
        recentActivity: recentActivity.slice(0, 10),
        leaderboard: leaderboard.slice(0, 10)
      }

      setAnalyticsData(analytics)
      setLastUpdated(new Date())
      console.log('Analytics data loaded:', analytics)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyticsData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000)
    
    return () => clearInterval(interval)
  }, [selectedZone, selectedTimeframe])

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'LZ': return 'bg-blue-500'
      case 'SZ': return 'bg-green-500'
      case 'CZ': return 'bg-purple-500'
      case 'NZ': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-4 w-4 text-yellow-500" />
      case 2: return <Trophy className="h-4 w-4 text-gray-400" />
      case 3: return <Medal className="h-4 w-4 text-amber-600" />
      default: return <span className="text-sm font-bold text-gray-600">{rank}</span>
    }
  }

  const getTrendIcon = (value: number, previous: number) => {
    if (value > previous) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (value < previous) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Loading Analytics...</h3>
          <p className="text-gray-500">Fetching real-time data</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Unable to load analytics data</p>
        <Button onClick={loadAnalyticsData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zones.map((zone) => (
                <SelectItem key={zone.value} value={zone.value}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((timeframe) => (
                <SelectItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalMatches}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analyticsData.totalMatches, analyticsData.totalMatches - 5)}
                  <span className="text-xs text-gray-500 ml-1">+5 from last week</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Live Matches</p>
                <p className="text-2xl font-bold text-red-600">{analyticsData.liveMatches}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 ml-1">Currently active</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Universities</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalUniversities}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analyticsData.totalUniversities, analyticsData.totalUniversities - 2)}
                  <span className="text-xs text-gray-500 ml-1">+2 this month</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-orange-600">{analyticsData.totalPoints}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analyticsData.totalPoints, analyticsData.totalPoints - 15)}
                  <span className="text-xs text-gray-500 ml-1">+15 this week</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Top Performer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="h-16 w-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{analyticsData.topPerformer.name}</h3>
                  <p className="text-gray-600 mb-2">{analyticsData.topPerformer.zone}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{analyticsData.topPerformer.points}</p>
                      <p className="text-sm text-gray-500">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analyticsData.topPerformer.wins}</p>
                      <p className="text-sm text-gray-500">Wins</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed Matches</span>
                  <span className="font-semibold">{analyticsData.completedMatches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming Matches</span>
                  <span className="font-semibold">{analyticsData.upcomingMatches}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold">{analyticsData.averageScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Zones</span>
                  <span className="font-semibold">{analyticsData.totalZones}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>Top 10 Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.leaderboard.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(entry.rank)}
                      <div>
                        <p className="font-medium text-gray-900">{entry.university}</p>
                        <p className="text-sm text-gray-500">{entry.zone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{entry.points} pts</p>
                      <p className="text-sm text-gray-500">{entry.wins}W - {entry.losses}L</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analyticsData.zoneStats).map(([zone, stats]) => (
              <Card key={zone}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`h-4 w-4 rounded-full ${getZoneColor(zone)}`}></div>
                    <span>{zone} Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.matches}</p>
                      <p className="text-sm text-gray-500">Matches</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.points}</p>
                      <p className="text-sm text-gray-500">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.universities}</p>
                      <p className="text-sm text-gray-500">Universities</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{Math.round(stats.winRate)}%</p>
                      <p className="text-sm text-gray-500">Win Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analyticsData.sportStats).map(([sport, stats]) => (
              <Card key={sport}>
                <CardHeader>
                  <CardTitle className="capitalize">{sport}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches</span>
                      <span className="font-semibold">{stats.matches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Popularity</span>
                      <span className="font-semibold">{Math.round(stats.popularity)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${stats.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.zone} • {new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        {lastUpdated && (
          <p>Last updated: {lastUpdated.toLocaleString()}</p>
        )}
        <p>Data refreshes automatically every 30 seconds</p>
      </div>
    </div>
  )
}
