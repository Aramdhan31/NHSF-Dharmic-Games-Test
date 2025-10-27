"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useFirebase } from "@/lib/firebase-context"
import { cn } from "@/lib/utils"
import { realtimeDbUtils } from "@/lib/firebase-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, 
  Trophy, 
  Eye,
  Search,
  Download,
  RefreshCw,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Bell,
  GraduationCap,
  Gamepad2,
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Target,
  Zap,
  Plus
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { MatchManagement } from "@/components/match-management"
import { UniversityManagement } from "@/components/university-management"

interface ZoneSpecificDashboardProps {
  currentZone: string
  currentUser: any
}

// Dashboard stats data
const getStats = (zoneData: any) => {
  if (!zoneData) return []
  
  return [
  {
    title: 'Total Universities',
    value: zoneData?.totalUniversities || '0',
    change: '+12%',
    changeType: 'positive' as const,
    icon: GraduationCap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    title: 'Active Players',
    value: zoneData?.totalPlayers || '0',
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: Activity,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    title: 'Live Matches',
    value: zoneData?.activeMatches || '0',
    change: '+15%',
    changeType: 'positive' as const,
    icon: Activity,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'Total Points',
    value: zoneData?.totalPoints || '0',
    change: '-2.4%',
    changeType: 'negative' as const,
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
]
}

// Dashboard Card Component
function DashboardCard({ stat, index }: { stat: any; index: number }) {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center space-x-1">
                <span className={cn(
                  "text-xs font-medium",
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">vs last month</span>
              </div>
            </div>
            <div className={cn("rounded-lg p-2 sm:p-3 flex-shrink-0", stat.bgColor)}>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6", stat.color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Zone Admin Sidebar Component
function ZoneAdminSidebar({ currentZone, currentUser, onLogout, isOpen, setIsOpen, activeSection, setActiveSection }: { currentZone: string; currentUser: any; onLogout: () => void; isOpen: boolean; setIsOpen: (open: boolean) => void; activeSection: string; setActiveSection: (section: string) => void }) {
  
  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange', bgColor: 'bg-orange-500', textColor: 'text-orange-600' },
    SZ: { name: 'South Zone', color: 'blue', bgColor: 'bg-blue-500', textColor: 'text-blue-600' },
    CZ: { name: 'Central Zone', color: 'green', bgColor: 'bg-green-500', textColor: 'text-green-600' },
    NZ: { name: 'North Zone', color: 'red', bgColor: 'bg-red-500', textColor: 'text-red-600' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", currentZoneConfig.bgColor)}>
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentZoneConfig.name}</h2>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button 
              onClick={() => {
                setActiveSection('dashboard')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'dashboard' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveSection('universities')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'universities' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="h-5 w-5" />
              <span>Universities</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveSection('matches')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'matches' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Gamepad2 className="h-5 w-5" />
              <span>Matches</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveSection('live-matches')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'live-matches' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Live Matches</span>
            </button>
            
            <button 
              onClick={() => {
                setActiveSection('results')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'results' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span>Results</span>
            </button>
            
            
            <button 
              onClick={() => {
                setActiveSection('settings')
                // Close sidebar on mobile
                if (window.innerWidth < 1024) {
                  setIsOpen(false)
                }
              }}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg w-full text-left ${
                activeSection === 'settings' 
                  ? 'bg-orange-50 text-orange-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.photoURL} />
                      <AvatarFallback>
                        {currentUser?.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{currentUser?.displayName}</p>
                      <p className="text-xs text-gray-500">{currentZoneConfig.name} Admin</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

    </div>
  )
}

// Dashboard Header Component
function DashboardHeader({ 
  searchQuery, 
  onSearchChange, 
  onRefresh, 
  onExport, 
  isRefreshing,
  onToggleSidebar
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onExport: () => void
  isRefreshing: boolean
  onToggleSidebar: () => void
}) {
  return (
    <div className="flex h-14 sm:h-16 items-center justify-between bg-white border-b px-3 sm:px-4 lg:px-6">
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Zone Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your zone's competitions</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-48 lg:w-64"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing} className="hidden sm:flex">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="hidden sm:flex">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="sm:hidden">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Add University Dialog is rendered at the ZoneSpecificDashboard level */}
    </div>
  )
}

// Quick Actions Component
function QuickActions({ onAddUser, onExport, currentZone, matches, universities, onManageMatches }: { onAddUser: () => void; onExport: () => void; currentZone: string; matches: any[]; universities: any[]; onManageMatches: () => void }) {
  const [showQuickResult, setShowQuickResult] = useState(false)
  const [showQuickMatch, setShowQuickMatch] = useState(false)
  const [quickResult, setQuickResult] = useState({ matchId: '', team1Score: '', team2Score: '' })
  const [quickMatch, setQuickMatch] = useState({ team1: '', team2: '', sport: '', venue: '', date: '', time: '' })

  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange' },
    SZ: { name: 'South Zone', color: 'blue' },
    CZ: { name: 'Central Zone', color: 'green' },
    NZ: { name: 'North Zone', color: 'red' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ

  const handleCreateMatch = () => {
    onManageMatches()
  }

  const handleQuickResultUpdate = async () => {
    if (!quickResult.matchId || !quickResult.team1Score || !quickResult.team2Score) return
    
    try {
      const result = await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${quickResult.matchId}`,
        {
          score: `${quickResult.team1Score}-${quickResult.team2Score}`,
          status: 'completed',
          updatedAt: new Date().toISOString()
        }
      )
      
      if (result.success) {
        setShowQuickResult(false)
        setQuickResult({ matchId: '', team1Score: '', team2Score: '' })
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error updating result:', error)
    }
  }

  const handleQuickMatchCreate = async () => {
    if (!quickMatch.team1 || !quickMatch.team2 || !quickMatch.sport) return
    
    try {
      const result = await realtimeDbUtils.pushData(
        `zones/${currentZone}/matches`,
        {
          ...quickMatch,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        }
      )
      
      if (result.success) {
        setShowQuickMatch(false)
        setQuickMatch({ team1: '', team2: '', sport: '', venue: '', date: '', time: '' })
        // Refresh data
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating match:', error)
    }
  }

  const sports = ['Football', 'Basketball', 'Cricket', 'Tennis', 'Badminton', 'Volleyball']
  const liveMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'live') : []
  const scheduledMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'scheduled') : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <span>{currentZoneConfig.name} Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        {/* Quick Result Update */}
        <div className="space-y-2">
          <Button 
            onClick={() => setShowQuickResult(!showQuickResult)} 
            className="w-full justify-start text-xs sm:text-sm" 
            variant="outline" 
            size="sm"
          >
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">Quick Result Update</span>
            <span className="sm:hidden">Results</span>
          </Button>
          
          {showQuickResult && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-xs font-medium text-gray-700">Update Match Result</div>
              <div className="space-y-2">
                <Select value={quickResult.matchId} onValueChange={(value) => setQuickResult({...quickResult, matchId: value})}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select match" />
                  </SelectTrigger>
                  <SelectContent>
                    {liveMatches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.team1} vs {match.team2}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Team 1 Score"
                    value={quickResult.team1Score}
                    onChange={(e) => setQuickResult({...quickResult, team1Score: e.target.value})}
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Team 2 Score"
                    value={quickResult.team2Score}
                    onChange={(e) => setQuickResult({...quickResult, team2Score: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
                <Button onClick={handleQuickResultUpdate} size="sm" className="w-full h-8 text-xs">
                  Update Result
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Match Creation */}
        <div className="space-y-2">
          <Button 
            onClick={() => setShowQuickMatch(!showQuickMatch)} 
            className="w-full justify-start text-xs sm:text-sm" 
            variant="outline" 
            size="sm"
          >
            <Gamepad2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            <span className="hidden sm:inline">Quick Match</span>
            <span className="sm:hidden">Match</span>
          </Button>
          
          {showQuickMatch && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="text-xs font-medium text-gray-700">Create Match</div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={quickMatch.team1} onValueChange={(value) => setQuickMatch({...quickMatch, team1: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.name}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={quickMatch.team2} onValueChange={(value) => setQuickMatch({...quickMatch, team2: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.name}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={quickMatch.sport} onValueChange={(value) => setQuickMatch({...quickMatch, sport: value})}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Venue"
                  value={quickMatch.venue}
                  onChange={(e) => setQuickMatch({...quickMatch, venue: e.target.value})}
                  className="h-8 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={quickMatch.date}
                    onChange={(e) => setQuickMatch({...quickMatch, date: e.target.value})}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="time"
                    value={quickMatch.time}
                    onChange={(e) => setQuickMatch({...quickMatch, time: e.target.value})}
                    className="h-8 text-xs"
                  />
                </div>
                <Button onClick={handleQuickMatchCreate} size="sm" className="w-full h-8 text-xs">
                  Create Match
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Other Actions */}
        <Button onClick={onAddUser} className="w-full justify-start text-xs sm:text-sm" variant="outline" size="sm">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Add University</span>
          <span className="sm:hidden">Add</span>
        </Button>
        <Button onClick={handleCreateMatch} className="w-full justify-start text-xs sm:text-sm" variant="outline" size="sm">
          <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Manage Matches</span>
          <span className="sm:hidden">Manage</span>
        </Button>
        <Button onClick={onExport} className="w-full justify-start text-xs sm:text-sm" variant="outline" size="sm">
          <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="hidden sm:inline">Export {currentZoneConfig.name} Data</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </CardContent>
    </Card>
  )
}
// Live Matches Component
function LiveMatches({ currentZone, matches }: { currentZone: string; matches: any[] }) {
  const [showLiveControls, setShowLiveControls] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [liveScore, setLiveScore] = useState({ team1: '', team2: '' })

  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange' },
    SZ: { name: 'South Zone', color: 'blue' },
    CZ: { name: 'Central Zone', color: 'green' },
    NZ: { name: 'North Zone', color: 'red' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ
  const liveMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'live') : []

  const handleStartMatch = async (matchId: string) => {
    try {
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { status: 'live', startedAt: new Date().toISOString() }
      )
      window.location.reload()
    } catch (error) {
      console.error('Error starting match:', error)
    }
  }

  const handleEndMatch = async (matchId: string) => {
    try {
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { 
          status: 'completed', 
          score: `${liveScore.team1}-${liveScore.team2}`,
          endedAt: new Date().toISOString() 
        }
      )
      setShowLiveControls(false)
      setSelectedMatch(null)
      setLiveScore({ team1: '', team2: '' })
      window.location.reload()
    } catch (error) {
      console.error('Error ending match:', error)
    }
  }

  const handleUpdateScore = async (matchId: string) => {
    try {
      await realtimeDbUtils.updateData(
        `zones/${currentZone}/matches/${matchId}`,
        { 
          score: `${liveScore.team1}-${liveScore.team2}`,
          updatedAt: new Date().toISOString() 
        }
      )
    } catch (error) {
      console.error('Error updating score:', error)
    }
  }

  if (liveMatches.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          <span>Live Matches</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {liveMatches.map((match) => (
          <div key={match.id} className="p-3 border rounded-lg bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">{match.team1} vs {match.team2}</div>
              <Badge variant="destructive" className="text-xs">LIVE</Badge>
            </div>
            <div className="text-xs text-gray-600 mb-2">{match.sport} • {match.venue}</div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setSelectedMatch(match)
                  setShowLiveControls(!showLiveControls)
                }}
                className="text-xs h-6"
              >
                {showLiveControls && selectedMatch?.id === match.id ? 'Hide' : 'Manage'}
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleEndMatch(match.id)}
                className="text-xs h-6 bg-red-600 hover:bg-red-700"
              >
                End Match
              </Button>
            </div>
            
            {showLiveControls && selectedMatch?.id === match.id && (
              <div className="mt-3 p-2 bg-white rounded border space-y-2">
                <div className="text-xs font-medium">Live Score Update</div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder={`${match.team1} Score`}
                    value={liveScore.team1}
                    onChange={(e) => setLiveScore({...liveScore, team1: e.target.value})}
                    className="h-6 text-xs"
                  />
                  <Input
                    placeholder={`${match.team2} Score`}
                    value={liveScore.team2}
                    onChange={(e) => setLiveScore({...liveScore, team2: e.target.value})}
                    className="h-6 text-xs"
                  />
                </div>
                <Button 
                  onClick={() => handleUpdateScore(match.id)} 
                  size="sm" 
                  className="w-full h-6 text-xs"
                >
                  Update Score
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Recent Activity Component
function RecentActivity({ currentZone, matches, universities }: { currentZone: string; matches: any[]; universities: any[] }) {
  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange' },
    SZ: { name: 'South Zone', color: 'blue' },
    CZ: { name: 'Central Zone', color: 'green' },
    NZ: { name: 'North Zone', color: 'red' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ

  // Generate recent activities based on zone data
  const activities = []
  
  if (matches && Array.isArray(matches) && matches.length > 0) {
    const recentMatches = matches.slice(0, 2)
    recentMatches.forEach(match => {
      activities.push({
        action: `${match.team1} vs ${match.team2} - ${match.status}`,
        time: "Recently",
        type: "match"
      })
    })
  }
  
  if (universities && Array.isArray(universities) && universities.length > 0) {
    const recentUniversities = universities.slice(0, 2)
    recentUniversities.forEach(university => {
      activities.push({
        action: `${university.name} added to ${currentZoneConfig.name}`,
        time: "Recently",
        type: "university"
      })
    })
  }

  // Fallback activities if no data
  if (activities.length === 0) {
    activities.push(
      { action: `Welcome to ${currentZoneConfig.name}`, time: "Now", type: "welcome" },
      { action: "No recent activity", time: "Yet", type: "empty" }
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <span>{currentZoneConfig.name} Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Users Table Component
function UsersTable({ onAddUser, currentZone, universities }: { onAddUser: () => void; currentZone: string; universities: any[] }) {
  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange' },
    SZ: { name: 'South Zone', color: 'blue' },
    CZ: { name: 'Central Zone', color: 'green' },
    NZ: { name: 'North Zone', color: 'red' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <span>{currentZoneConfig.name} Universities</span>
          </CardTitle>
          <Button onClick={onAddUser} size="sm" className="text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add University</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {universities && Array.isArray(universities) && universities.length > 0 ? (
          <div className="space-y-3">
            {universities.map((university, index) => (
              <div key={university.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{university.name}</p>
                    <p className="text-xs text-gray-500">{university.abbreviation}</p>
                  </div>
                </div>
                <Badge variant={university.isActive ? "default" : "secondary"}>
                  {university.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <GraduationCap className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600">No {currentZoneConfig.name} universities found</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Add your first university to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Revenue Chart Component (adapted for zone data)
function RevenueChart({ currentZone, matches }: { currentZone: string; matches: any[] }) {
  const zoneConfig = {
    LZ: { name: 'London Zone', color: 'orange' },
    SZ: { name: 'South Zone', color: 'blue' },
    CZ: { name: 'Central Zone', color: 'green' },
    NZ: { name: 'North Zone', color: 'red' }
  }

  const currentZoneConfig = zoneConfig[currentZone as keyof typeof zoneConfig] || zoneConfig.LZ
  
  // Calculate zone-specific match statistics
  const completedMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'completed') : []
  const liveMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'live') : []
  const upcomingMatches = (matches && Array.isArray(matches)) ? matches.filter(match => match.status === 'scheduled') : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          <span>{currentZoneConfig.name} Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Match Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{completedMatches.length}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{liveMatches.length}</div>
              <div className="text-xs text-orange-700">Live</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{upcomingMatches.length}</div>
              <div className="text-xs text-blue-700">Upcoming</div>
            </div>
          </div>
          
          {/* Recent Matches */}
          {matches && Array.isArray(matches) && matches.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Recent Matches</h4>
              <div className="space-y-2">
                {matches.slice(0, 3).map((match, index) => (
                  <div key={match.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium">{match.team1} vs {match.team2}</span>
                    </div>
                    <Badge variant={match.status === 'completed' ? 'default' : match.status === 'live' ? 'destructive' : 'secondary'}>
                      {match.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600">No {currentZoneConfig.name} matches found</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Create matches to see performance data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ZoneSpecificDashboard({ currentZone, currentUser }: ZoneSpecificDashboardProps) {
  const { signOut } = useFirebase()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoneData, setZoneData] = useState<any>(null)
  const [universities, setUniversities] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showAddUniversity, setShowAddUniversity] = useState(false)
  const [newUniName, setNewUniName] = useState('')
  const [newUniAbbr, setNewUniAbbr] = useState('')
  const [savingUni, setSavingUni] = useState(false)
  const [addUniError, setAddUniError] = useState<string | null>(null)

  // Load zone-specific data
  useEffect(() => {
    const loadZoneData = async () => {
      try {
        // Load zone statistics
        const statsResult = await realtimeDbUtils.getData(`zones/${currentZone}/stats`)
        if (statsResult.success && statsResult.data) {
          setZoneData(statsResult.data)
        }

        // Load zone universities
        const universitiesResult = await realtimeDbUtils.getData(`zones/${currentZone}/universities`)
        if (universitiesResult.success && universitiesResult.data) {
          // Normalize object map from Firebase into array with firebaseId as id
          const universitiesData = Array.isArray(universitiesResult.data)
            ? universitiesResult.data
            : Object.entries(universitiesResult.data).map(([firebaseId, university]: [string, any]) => ({
                ...(university as any),
                id: firebaseId,
              }))
          setUniversities(universitiesData)
        } else {
          setUniversities([])
        }

        // Load zone matches
        const matchesResult = await realtimeDbUtils.getData(`zones/${currentZone}/matches`)
        if (matchesResult.success && matchesResult.data) {
          // Normalize object map from Firebase into array with firebase key as id
          const matchesData = Array.isArray(matchesResult.data)
            ? matchesResult.data
            : Object.entries(matchesResult.data).map(([id, match]: [string, any]) => ({
                id,
                ...(match as object),
              }))
          setMatches(matchesData)
        } else {
          setMatches([])
        }
      } catch (error) {
        console.error('Error loading zone data:', error)
      }
    }
    
    loadZoneData()
  }, [currentZone])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleExport = () => {
    console.log('Exporting data...')
  }

  const handleAddUser = () => {
    setAddUniError(null)
    setNewUniName('')
    setNewUniAbbr('')
    setShowAddUniversity(true)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  const stats = getStats(zoneData) || []

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <ZoneAdminSidebar 
        currentZone={currentZone} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          onExport={handleExport}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        {/* Add University Dialog */}
        <Dialog open={showAddUniversity} onOpenChange={setShowAddUniversity}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add University to {currentZone}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="University name"
                value={newUniName}
                onChange={(e) => setNewUniName(e.target.value)}
              />
              <Input
                placeholder="Abbreviation (e.g., UCL)"
                value={newUniAbbr}
                onChange={(e) => setNewUniAbbr(e.target.value)}
              />
              {addUniError && <p className="text-sm text-red-600">{addUniError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowAddUniversity(false)}>Cancel</Button>
                <Button
                  onClick={async () => {
                    setAddUniError(null)
                    if (!newUniName.trim() || !newUniAbbr.trim()) {
                      setAddUniError('Name and abbreviation are required.')
                      return
                    }
                    setSavingUni(true)
                    try {
                      const result = await realtimeDbUtils.pushData(`zones/${currentZone}/universities`, {
                        name: newUniName.trim(),
                        abbreviation: newUniAbbr.trim().toUpperCase(),
                        isActive: true,
                        zone: currentZone,
                        createdAt: new Date().toISOString(),
                      })
                      if (result.success) {
                        const universitiesResult = await realtimeDbUtils.getData(`zones/${currentZone}/universities`)
                        if (universitiesResult.success && universitiesResult.data) {
                          const universitiesData = Array.isArray(universitiesResult.data)
                            ? universitiesResult.data
                            : Object.entries(universitiesResult.data).map(([firebaseId, university]: [string, any]) => ({
                                ...(university as any),
                                id: firebaseId,
                              }))
                          setUniversities(universitiesData)
                        }
                        setShowAddUniversity(false)
                      } else {
                        setAddUniError('Failed to add university. Please try again.')
                      }
                    } catch (err) {
                      console.error('Error adding university:', err)
                      setAddUniError('Unexpected error while saving.')
                    } finally {
                      setSavingUni(false)
                    }
                  }}
                  disabled={savingUni}
                >
                  {savingUni ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="flex-1 overflow-auto p-2 sm:p-4 lg:p-6">
          <div className="mx-auto max-w-7xl space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Dashboard Section */}
            {activeSection === 'dashboard' && (
              <>
                <div className="px-1 sm:px-2" data-section="dashboard">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                    Welcome to {currentZone} Zone
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm lg:text-base mt-1">
                    Here's what's happening with your zone today.
                  </p>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 xl:grid-cols-4">
                  {stats.map((stat, index) => (
                    <DashboardCard key={stat.title} stat={stat} index={index} />
                  ))}
                </div>
                
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 xl:grid-cols-3">
                  {/* Charts Section */}
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6 xl:col-span-2">
                    <RevenueChart currentZone={currentZone} matches={matches} />
                    <UsersTable onAddUser={handleAddUser} currentZone={currentZone} universities={universities} />
                  </div>
                  
                  {/* Sidebar Section */}
                  <div className="space-y-3 sm:space-y-4 lg:space-y-6" data-section="live-matches">
                    <LiveMatches currentZone={currentZone} matches={matches} />
                    <QuickActions
                      onAddUser={handleAddUser}
                      onExport={handleExport}
                      currentZone={currentZone}
                      matches={matches}
                      universities={universities}
                      onManageMatches={() => setActiveSection('matches')}
                    />
                    <RecentActivity currentZone={currentZone} matches={matches} universities={universities} />
                  </div>
                </div>
              </>
            )}

            {/* Universities Section */}
            {activeSection === 'universities' && (
              <div className="space-y-4">
                <UniversityManagement currentZone={currentZone} currentUser={currentUser} />
              </div>
            )}

            {/* Matches Section */}
            {activeSection === 'matches' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Matches Management</h2>
                  <Button onClick={() => setActiveSection('live-matches')}>
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Live Matches
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {/* Use the same full MatchManagement experience as /admin */}
                    <MatchManagement currentZone={currentZone} />
                </div>
              </div>
            )}

            {/* Live Matches Section */}
            {activeSection === 'live-matches' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Live Matches</h2>
                  <Button onClick={() => setActiveSection('matches')}>
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    All Matches
                  </Button>
                </div>
                <LiveMatches currentZone={currentZone} matches={matches} />
                <QuickActions
                  onAddUser={handleAddUser}
                  onExport={handleExport}
                  currentZone={currentZone}
                  matches={matches}
                  universities={universities}
                  onManageMatches={() => setActiveSection('matches')}
                />
              </div>
            )}

            {/* Results Section */}
            {activeSection === 'results' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Match Results</h2>
                <RevenueChart currentZone={currentZone} matches={matches} />
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Results management features coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Use quick actions to update match results</p>
                </div>
              </div>
            )}


            {/* Settings Section */}
            {activeSection === 'settings' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Zone Settings</h2>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Settings features coming soon</p>
                  <p className="text-sm text-gray-500 mt-1">Zone configuration options will be available here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}