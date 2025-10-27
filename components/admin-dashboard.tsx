"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Users, 
  Settings, 
  MapPin, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from "lucide-react"
import { UniversityManagement } from "./university-management"
import { User } from "@/lib/user-management"

interface AdminDashboardProps {
  currentUser: User | null
}

export const AdminDashboard = ({ currentUser }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview")

  const zones = [
    {
      id: "NZ+CZ",
      name: "North & Central Zone",
      date: "November 22, 2025",
      status: "confirmed",
      universities: 21,
      sports: ["Netball", "Kabaddi", "Kho kho", "Badminton"],
      venue: "TBD",
      description: "Combined North Zone and Central Zone tournament"
    },
    {
      id: "LZ+SZ", 
      name: "London & South Zone",
      date: "November 23, 2025",
      status: "confirmed",
      universities: 21,
      sports: ["Netball", "Kabaddi", "Kho kho", "Badminton"],
      venue: "Queen Park Community School",
      description: "Combined London Zone and South Zone tournament"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-300"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled": return "bg-red-100 text-red-800 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-4 h-4" />
      case "pending": return <AlertTriangle className="w-4 h-4" />
      case "cancelled": return <XCircle className="w-4 h-4" />
      default: return <Pause className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage tournaments, universities, and matches</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Admin Access
          </Badge>
          <span className="text-sm text-gray-500">
            {currentUser?.email || "Admin User"}
          </span>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="nz-cz" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>NZ+CZ</span>
          </TabsTrigger>
          <TabsTrigger value="lz-sz" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>LZ+SZ</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <span>{zone.name}</span>
                    </CardTitle>
                    <Badge className={getStatusColor(zone.status)}>
                      {getStatusIcon(zone.status)}
                      <span className="ml-1 capitalize">{zone.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{zone.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{zone.universities} universities</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Venue</h4>
                      <p className="text-sm text-gray-600">{zone.venue}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sports</h4>
                      <div className="flex flex-wrap gap-2">
                        {zone.sports.map((sport) => (
                          <Badge key={sport} variant="outline" className="text-xs">
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => setActiveTab(zone.id.toLowerCase())}
                    >
                      Manage {zone.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* NZ+CZ Tab */}
        <TabsContent value="nz-cz" className="space-y-6">
          <ZoneManagement zone="NZ+CZ" zoneData={zones[0]} currentUser={currentUser} />
        </TabsContent>

        {/* LZ+SZ Tab */}
        <TabsContent value="lz-sz" className="space-y-6">
          <ZoneManagement zone="LZ+SZ" zoneData={zones[1]} currentUser={currentUser} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Settings and configuration options will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Zone Management Component
const ZoneManagement = ({ zone, zoneData, currentUser }: { 
  zone: string
  zoneData: any
  currentUser: User | null 
}) => {
  const [activeZoneTab, setActiveZoneTab] = useState("universities")

  return (
    <div className="space-y-6">
      {/* Zone Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{zoneData.name}</h2>
          <p className="text-sm text-gray-600 mt-1">{zoneData.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{zoneData.date}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{zoneData.venue}</span>
            </div>
          </div>
        </div>
        <Badge className={getStatusColor(zoneData.status)}>
          {getStatusIcon(zoneData.status)}
          <span className="ml-1 capitalize">{zoneData.status}</span>
        </Badge>
      </div>

      {/* Zone Tabs */}
      <Tabs value={activeZoneTab} onValueChange={setActiveZoneTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="universities" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>University Management</span>
          </TabsTrigger>
          <TabsTrigger value="football" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Football</span>
          </TabsTrigger>
          <TabsTrigger value="netball" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Netball</span>
          </TabsTrigger>
          <TabsTrigger value="kabaddi" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Kabaddi</span>
          </TabsTrigger>
          <TabsTrigger value="kho-kho" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Kho kho</span>
          </TabsTrigger>
          <TabsTrigger value="badminton" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Badminton</span>
          </TabsTrigger>
        </TabsList>

        {/* Universities Tab */}
        <TabsContent value="universities">
          <UniversityManagement currentZone={zone} currentUser={currentUser} />
        </TabsContent>

        {/* Sport-specific tabs */}
        <TabsContent value="football">
          <SportManagement zone={zone} sport="Football" currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="netball">
          <SportManagement zone={zone} sport="Netball" currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="kabaddi">
          <SportManagement zone={zone} sport="Kabaddi" currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="kho-kho">
          <SportManagement zone={zone} sport="Kho kho" currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="badminton">
          <SportManagement zone={zone} sport="Badminton" currentUser={currentUser} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sport Management Component
const SportManagement = ({ zone, sport, currentUser }: { 
  zone: string
  sport: string
  currentUser: User | null 
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-500" />
            <span>{sport} Management - {zone}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Teams Competing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-sm text-gray-600">Universities registered</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Matches Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">24</p>
                <p className="text-sm text-gray-600">Total matches</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-sm text-gray-600">Teams withdrawn</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Team Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Manchester</span>
                <Badge className="bg-green-100 text-green-800">Competing</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium">Leeds</span>
                <Badge className="bg-yellow-100 text-yellow-800">Withdrawn from {sport}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="font-medium">Sheffield</span>
                <Badge className="bg-red-100 text-red-800">Not Competing</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions (same as above)
const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-800 border-green-300"
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300"
    case "cancelled": return "bg-red-100 text-red-800 border-red-300"
    default: return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed": return <CheckCircle className="w-4 h-4" />
    case "pending": return <AlertTriangle className="w-4 h-4" />
    case "cancelled": return <XCircle className="w-4 h-4" />
    default: return <Pause className="w-4 h-4" />
  }
}
