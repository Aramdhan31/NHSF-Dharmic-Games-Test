import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Target, Crown } from "lucide-react"

interface Team {
  zone: string
  name: string
  color: string
  members: number
  wins: number
  losses: number
  points: number
  captain: string
  description: string
}

interface TeamCardProps {
  team: Team
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        {/* Mobile-optimized header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${team.color}`}></div>
            <div>
              <CardTitle className="text-lg sm:text-xl">{team.name}</CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">
                {team.zone}
              </Badge>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold text-orange-600">{team.points}</p>
            <p className="text-xs sm:text-sm text-gray-500">Points</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm sm:text-base text-gray-600">{team.description}</p>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Crown className="w-4 h-4" />
          <span>
            Captain: <strong>{team.captain}</strong>
          </span>
        </div>

        {/* Mobile-optimized stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{team.members}</span>
            </div>
            <p className="text-xs text-gray-500">Members</p>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{team.wins}</span>
            </div>
            <p className="text-xs text-gray-500">Wins</p>
          </div>

          <div>
            <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="font-semibold text-sm sm:text-base">{team.losses}</span>
            </div>
            <p className="text-xs text-gray-500">Losses</p>
          </div>
        </div>

        <Button className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-10 text-sm sm:text-base">
          View Team Details
        </Button>
      </CardContent>
    </Card>
  )
}
