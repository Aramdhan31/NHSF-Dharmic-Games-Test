"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Calendar, MapPin, Users, Play, Clock, Target } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { universities } from "@/app/teams/page"

export default function ZonalsPage() {
  const [selectedZone, setSelectedZone] = useState<string>("all")

  const zones = [
    { value: "all", label: "All Zones" },
    { value: "NZ+CZ", label: "North & Central Zone (Nov 22)" },
    { value: "LZ+SZ", label: "London & South Zone (Nov 23)" }
  ]

  // Calculate dynamic university counts
  const nzCzUniversities = universities.filter(uni => uni.zone === "NZ+CZ").length
  const lzSzUniversities = universities.filter(uni => uni.zone === "LZ+SZ").length

  const tournaments = [
    {
      id: "nz-cz",
      name: "North & Central Zone Tournament",
      zone: "NZ+CZ",
      date: "November 22, 2025",
      venue: "Avanti Field School",
      address: "21 Bhaktivedanta Marg, Leicester, LE5 0BX, England",
      status: "upcoming",
      universities: nzCzUniversities,
      sports: ["Kho Kho", "Badminton", "Netball", "Kabaddi"],
      description: `The North & Central Zone tournament will feature ${nzCzUniversities} universities competing across multiple sports at Avanti Field School in Leicester.`,
      schedule: {
        morning: "8:30 AM - 12:45 PM",
        afternoon: "12:00 PM - 4:45 PM"
      },
      venues: [
        { name: "Large Sports Hall", time: "8:30am-4:45pm", sports: ["Netball", "Badminton", "Kho Kho"] },
        { name: "Main Hall", time: "9:00am-2:45pm", sports: ["Kabaddi"] },
        { name: "Sports Hall", time: "11:30am-2:30pm", sports: ["Kho Kho"] }
      ]
    },
    {
      id: "lz-sz",
      name: "London & South Zone Tournament",
      zone: "LZ+SZ",
      date: "November 23, 2025",
      venue: "Queen Park Community School",
      address: "Aylestone Ave, London NW6 7BQ, England",
      status: "upcoming",
      universities: lzSzUniversities,
      sports: ["Kho Kho", "Badminton", "Netball", "Kabaddi"],
      description: `The London & South Zone tournament brings together ${lzSzUniversities} universities from London and South regions for an exciting day of competition.`,
      schedule: {
        morning: "9:00 AM - 2:00 PM",
        afternoon: "12:00 PM - 6:00 PM"
      },
      venues: [
        { name: "Gym", time: "9:00am-2pm", sports: ["Kho Kho"] },
        { name: "Sports Hall", time: "8:00am-6pm", sports: ["Badminton", "Netball", "Kho Kho"] },
        { name: "Hall", time: "1pm-3pm", sports: ["Kabaddi"] },
        { name: "Sports Hall", time: "12pm-3pm", sports: ["Kho Kho"] }
      ]
    }
  ]

  const filteredTournaments = selectedZone === "all" 
    ? tournaments 
    : tournaments.filter(tournament => tournament.zone === selectedZone)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-300"
      case "live": return "bg-green-100 text-green-800 border-green-300"
      case "completed": return "bg-gray-100 text-gray-800 border-gray-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'LZ+SZ': return 'bg-gradient-to-r from-blue-500 to-yellow-500'
      case 'NZ+CZ': return 'bg-gradient-to-r from-red-500 to-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getZoneName = (zone: string) => {
    switch (zone) {
      case 'LZ+SZ': return 'London & South Zone'
      case 'NZ+CZ': return 'North & Central Zone'
      default: return zone
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Trophy className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                NHSF (UK) Zonal Competition
              </h1>
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Two exciting zonal tournaments bringing together universities from across the UK for competitive sports and cultural exchange.
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

          {/* Tournaments */}
          <div className="space-y-8">
            {filteredTournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full ${getZoneColor(tournament.zone)}`}></div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl">{tournament.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getZoneName(tournament.zone)}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(tournament.status)}`}>
                            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl sm:text-2xl font-bold text-orange-600">{tournament.universities}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Universities</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <p className="text-gray-600">{tournament.description}</p>

                  {/* Tournament Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Tournament Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{tournament.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Venue:</span>
                          <span className="font-medium">{tournament.venue}</span>
                        </div>
                        {tournament.address !== "Location to be confirmed" && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="font-medium text-xs">{tournament.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Competition Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Universities:</span>
                          <span className="font-medium">{tournament.universities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sports:</span>
                          <span className="font-medium">{tournament.sports.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(tournament.status)}`}>
                            {tournament.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sports */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <Trophy className="w-4 h-4 mr-2" />
                      Competing Sports
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tournament.sports.map((sport, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Venue Information */}
                  {tournament.venues && tournament.venues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Venue Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tournament.venues.map((venue, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{venue.name}</span>
                              <span className="text-xs text-gray-600">{venue.time}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {venue.sports.map((sport, sportIndex) => (
                                <Badge key={sportIndex} variant="outline" className="text-xs">
                                  {sport}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button asChild className="bg-orange-600 hover:bg-orange-700 flex-1">
                      <Link href={`/teams?zone=${tournament.zone}`}>
                        <Users className="w-4 h-4 mr-2" />
                        View Universities
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link href="/live">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Live
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-blue-600">2 Tournaments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  London & South Zone and North & Central Zone
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-green-600">53 Universities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Participating across both tournaments
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-purple-600">5 Sports</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Kho Kho, Badminton, Netball, Kabaddi, Football
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Tournament schedules and results will be updated in real-time during the events.
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
