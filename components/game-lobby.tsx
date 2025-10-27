"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export function GameLobby() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Compete!</h3>
        <p className="text-gray-600 mb-4">Games are started by NHSF (UK) admins during competition times.</p>
        <p className="text-sm text-gray-500">
          When a game starts, you'll see it appear below and can join if your team is selected.
        </p>
      </CardContent>
    </Card>
  )
}
