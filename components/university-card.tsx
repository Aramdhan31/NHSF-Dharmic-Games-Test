"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Target, MapPin, Calendar, EyeOff, Heart, Bell, Edit3, Check, X } from "lucide-react"
import { useFavoriteUniversities } from "@/hooks/use-local-storage"
import { useNotifications } from "@/hooks/use-notifications"
import { updateUniversityStatus } from "@/utils/updateUniversity"
import { useState } from "react"

interface University {
  id: string
  name: string
  zone: string
  sports: string[]
  members: number
  wins: number
  losses: number
  points: number
  description: string
  tournamentDate?: string
  isCompeting?: boolean
  status?: string
}

interface UniversityCardProps {
  university: University
  onViewDetails?: (university: University) => void
  showAdminControls?: boolean
}

export function UniversityCard({ university, onViewDetails, showAdminControls = false }: UniversityCardProps) {
  const { isFavorite, toggleFavorite } = useFavoriteUniversities()
  const { addNotification } = useNotifications()
  const [isUpdating, setIsUpdating] = useState(false)

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'LZ+SZ': return 'bg-gradient-to-r from-blue-500 to-yellow-500'
      case 'NZ+CZ': return 'bg-gradient-to-r from-red-500 to-green-500'
      case 'LZ': return 'bg-blue-500'
      case 'SZ': return 'bg-yellow-500'
      case 'NZ': return 'bg-red-500'
      case 'CZ': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const handleToggleFavorite = () => {
    toggleFavorite(university.id)
    
    // Add notification when favoriting
    if (!isFavorite(university.id)) {
      addNotification({
        type: 'tournament_update',
        title: 'University Added to Favorites!',
        message: `${university.name} has been added to your favorites. You'll receive notifications for their matches.`,
        universityId: university.id
      })
    }
  }

  const handleToggleStatus = async () => {
    if (isUpdating) return
    
    setIsUpdating(true)
    const newStatus = university.status === "competing" ? "affiliated" : "competing"
    
    try {
      await updateUniversityStatus(university.id, newStatus)
      
      // Add notification
      addNotification({
        type: 'tournament_update',
        title: 'University Status Updated!',
        message: `${university.name} is now ${newStatus === "competing" ? "competing" : "affiliated"}.`,
        universityId: university.id
      })
    } catch (error) {
      console.error('Error updating university status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getZoneName = (zone: string) => {
    switch (zone) {
      case 'LZ+SZ': return 'London & South Zone'
      case 'NZ+CZ': return 'North & Central Zone'
      case 'LZ': return 'London Zone'
      case 'SZ': return 'South Zone'
      case 'NZ': return 'North Zone'
      case 'CZ': return 'Central Zone'
      default: return zone
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${getZoneColor(university.zone)}`}></div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg sm:text-xl">{university.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  className={`p-1 h-auto ${isFavorite(university.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(university.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getZoneName(university.zone)}
                </Badge>
                {university.tournamentDate && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {university.tournamentDate}
                  </Badge>
                )}
                {isFavorite(university.id) && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                    <Heart className="w-3 h-3 mr-1 fill-current" />
                    Favorite
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{university.points}</p>
            <p className="text-xs sm:text-sm text-gray-500">Points</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm sm:text-base text-gray-600">{university.description}</p>

        {/* Competing Status with Live Editing */}
        <div className="mb-4">
          {university.status === "competing" || university.isCompeting === true ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-700">
                  <Trophy className="w-4 h-4" />
                  <span className="font-medium text-sm">Competing</span>
                </div>
                {showAdminControls && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className="h-7 px-2 text-xs bg-white hover:bg-gray-50 border-green-300 text-green-700 hover:text-green-800"
                  >
                    {isUpdating ? (
                      <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Set Affiliated
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-green-600 text-xs mt-1">
                This university is actively participating in the tournament
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-red-700">
                  <EyeOff className="w-4 h-4" />
                  <span className="font-medium text-sm">Affiliated</span>
                </div>
                {showAdminControls && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className="h-7 px-2 text-xs bg-white hover:bg-gray-50 border-red-300 text-red-700 hover:text-red-800"
                  >
                    {isUpdating ? (
                      <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Set Competing
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-red-600 text-xs mt-1">
                This university is affiliated but not yet competing
              </p>
            </div>
          )}
        </div>

        {/* Sports Section - Only show for competing universities */}
        {(university.status === "competing" || university.isCompeting === true) && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">
                {university.sports && university.sports.length > 0 ? 'Competing Sports:' : 'No Sports Assigned'}
              </span>
            </div>
            {university.sports && university.sports.length > 0 ? (
            <div className="space-y-3">
              {/* Display sports as badges */}
              <div className="flex flex-wrap gap-2">
                {university.sports.map((sport, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {sport}
                  </Badge>
                ))}
              </div>
              
              {/* Display players for each sport if available */}
              {university.sportsData && Object.keys(university.sportsData).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(university.sportsData).map(([sportName, sportData]: [string, any]) => (
                    <div key={sportName} className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-semibold text-sm text-gray-800 mb-2">{sportName}</h4>
                      {sportData.players && Object.keys(sportData.players).length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                          {Object.values(sportData.players).map((player: any, i: number) => (
                            <div key={i} className="text-xs text-gray-600 bg-white rounded px-2 py-1">
                              {player.fullName || player.name || `Player ${i + 1}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No players registered yet</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              This university can be assigned sports in the admin panel
            </div>
          )}
          </div>
        )}


        {/* Mobile-optimized stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{university.members}</span>
            </div>
            <p className="text-xs text-gray-500">Members</p>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{university.wins}</span>
            </div>
            <p className="text-xs text-gray-500">Wins</p>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{university.losses}</span>
            </div>
            <p className="text-xs text-gray-500">Losses</p>
          </div>
        </div>

        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-10 text-sm sm:text-base"
          onClick={() => onViewDetails?.(university)}
        >
          View University Details
        </Button>
      </CardContent>
    </Card>
  )
}
