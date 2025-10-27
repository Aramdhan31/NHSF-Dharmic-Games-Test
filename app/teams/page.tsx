"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UniversityCard } from "@/components/university-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Target, Zap, Calendar, Filter, MapPin, Plus, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { ref, set } from "firebase/database"
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore"
import { auth, realtimeDb, db } from "@/lib/firebase"
import { updateUniversityStatus } from "@/utils/updateUniversity"

// ======================
// UNIVERSITIES DATA
// ======================
export const universities = [
  // ===== NORTH & CENTRAL ZONE (NZ+CZ) - Nov 22, 2025 =====
  // Venue information and sport selections pending - forms not yet sent to chapters
  // University list confirmed but competing sports TBD
  
  { id: "40", name: "Aston", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Aston Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "48", name: "Birmingham", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "University of Birmingham Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "41", name: "Cambridge", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Cambridge Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "42", name: "Coventry", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Coventry Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "43", name: "DMU", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "DMU Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "33", name: "Dundee", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Dundee Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "49", name: "East Anglia", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "UEA Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "34", name: "Edinburgh", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Edinburgh Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "35", name: "Keele", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Keele Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "36", name: "Lancaster", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Lancaster Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "2", name: "Leeds", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Leeds University Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "44", name: "Leicester", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Leicester Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "45", name: "Loughborough", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Loughborough Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "3", name: "Manchester", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Manchester Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "46", name: "Northampton", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Northampton Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "4", name: "Nottingham", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Nottingham Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "47", name: "Nottingham Trent", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Nottingham Trent Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "37", name: "Sheffield", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Sheffield Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "38", name: "UCLAN", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "UCLAN Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "50", name: "Warwick", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Warwick Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },
  { id: "39", name: "York", zone: "NZ+CZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "York Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 22, 2025", isCompeting: false },

  // ===== LONDON & SOUTH ZONE (LZ+SZ) - Nov 23, 2025 =====
  // Venue Capacity: Gym (9am-2pm), Sports Hall (8am-6pm), Hall (1pm-3pm), Sports Hall (12pm-3pm)
  // Available Slots: AM - 1 Kho Kho, 3 Badminton, 1 Kho Kho | PM - 1 Netball, 1 Kabaddi, 2 Kho Kho
  // Sport selections pending form submission to chapters
  
  { id: "5", name: "ARU", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Anglia Ruskin University - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "52", name: "Bristol", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Bristol Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "53", name: "Brunel", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Brunel Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "54", name: "Cardiff", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Cardiff Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "55", name: "City", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "City Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "56", name: "East London", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "East London Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "57", name: "Essex", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Essex Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "58", name: "Exeter", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Exeter Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "15", name: "Greenwich", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Greenwich Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "16", name: "Hertfordshire", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Hertfordshire Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "17", name: "Imperial", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Imperial Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "18", name: "KCL", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "KCL Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "20", name: "LSE", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "LSE Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "21", name: "Oxford", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Oxford Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "59", name: "Oxford Brookes", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Oxford Brookes Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "22", name: "Plymouth", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Plymouth Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "23", name: "Portsmouth", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Portsmouth Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "24", name: "QMUL", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "QMUL Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "26", name: "Royal Holloway", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Royal Holloway Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "28", name: "St George's", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "St George's Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "30", name: "Swansea", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Swansea Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "31", name: "UCL", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "UCL Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
  { id: "32", name: "Westminster", zone: "LZ+SZ", sports: ["TBD"], members: 0, wins: 0, losses: 0, points: 0, description: "Westminster University Hindu Society - Sport selection pending form submission.", tournamentDate: "Nov 23, 2025", isCompeting: false },
]

export default function TeamsPage() {
  const router = useRouter()
  const [selectedTournament, setSelectedTournament] = useState<"all" | "NZ+CZ" | "LZ+SZ">("all")
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null)
  
  // Registration form state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formUniversityName, setFormUniversityName] = useState("")
  const [formRegion, setFormRegion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Dynamic universities data from Firebase
  const [universitiesData, setUniversitiesData] = useState<any[]>([])
  const [loadingUniversities, setLoadingUniversities] = useState(true)

  // Dynamic venue information
  const venueInfo = {
    'NZ+CZ': {
      name: 'Avanti Field School',
      address: '21 Bhaktivedanta Marg, Leicester, LE5 0BX, England',
      availability: [
        { facility: 'Large Sports Hall', time: '8:30am-4:45pm' },
        { facility: 'Main Hall', time: '9:00am-2:45pm' },
        { facility: 'Sports Hall', time: '11:30am-2:30pm' }
      ],
      slots: {
        morning: [
          'Netball courts (Large Sports Hall)',
          'Badminton courts (Large Sports Hall)', 
          'Kabaddi Female (Main Hall)'
        ],
        afternoon: [
          'Kabaddi Male (Main Hall)',
          'Sports hall',
          'Kho Kho pitches (Large Sports Hall)'
        ]
      }
    },
    'LZ+SZ': {
      name: 'Queen Park Community School',
      address: 'Aylestone Ave, London NW6 7BQ, England',
      availability: [
        { facility: 'Gym', time: '9:00am-2pm' },
        { facility: 'Sports Hall', time: '8:00am-6pm' },
        { facility: 'Hall', time: '1pm-3pm' },
        { facility: 'Sports Hall', time: '12pm-3pm' }
      ],
      slots: {
        morning: [
          '1 Kho Kho pitch (Gym)',
          '3 Badminton courts (Sports Hall)',
          '1 Kho Kho pitch (Sports Hall)'
        ],
        afternoon: [
          '1 Netball court (Sports Hall)',
          '1 Kabaddi court (Hall)',
          '2 Kho Kho pitches (Sports Hall)'
        ]
      }
    }
  }

  // Real-time Firestore listener for universities
  useEffect(() => {
    const universitiesRef = collection(db, "universities")
    const q = query(universitiesRef, orderBy("name"))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const registeredUniversities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        zone: doc.data().zone || "Unknown",
        sports: doc.data().sports || [],
        members: doc.data().members || 0,
        wins: doc.data().wins || 0,
        losses: doc.data().losses || 0,
        points: doc.data().points || 0,
        description: doc.data().description || `${doc.data().name} Hindu Society`,
        tournamentDate: doc.data().date === "2025-11-22" ? "Nov 22, 2025" : "Nov 23, 2025",
        isCompeting: doc.data().status === "competing" || doc.data().isCompeting === true,
        isRegistered: true
      }))
      
      // Separate universities into competing and not competing, then sort each group alphabetically
      const competingUniversities = registeredUniversities
        .filter(uni => uni.status === "competing" || uni.isCompeting === true)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const notCompetingUniversities = registeredUniversities
        .filter(uni => uni.status !== "competing" && uni.isCompeting !== true)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const sortedUniversities = [...competingUniversities, ...notCompetingUniversities]
      
      setUniversitiesData(sortedUniversities)
      setLoadingUniversities(false)
    }, (error) => {
      console.error("Error fetching universities:", error)
      setLoadingUniversities(false)
    })
    
    return () => unsubscribe()
  }, [])

  // ✅ Automatically sort alphabetically by name
  const filteredUniversities = (
    selectedTournament === "all"
      ? universitiesData
      : universitiesData.filter((uni) => uni.zone === selectedTournament)
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Count universities that are actually competing (based on isCompeting field or status)
  const competingUniversitiesList = filteredUniversities.filter(uni => 
    uni.isCompeting === true || uni.status === "competing"
  )
  
  const totalCompetingUniversities = competingUniversitiesList.length
  const totalRegisteredUniversities = filteredUniversities.length

  const totalPlayers = filteredUniversities.reduce((sum, uni) => sum + (uni.members || 0), 0)
  const totalWins = filteredUniversities.reduce((sum, uni) => sum + (uni.wins || 0), 0)
  const totalGames = filteredUniversities.reduce((sum, uni) => sum + (uni.wins || 0) + (uni.losses || 0), 0)
  const totalPoints = filteredUniversities.reduce((sum, uni) => sum + (uni.points || 0), 0)

  const handleViewDetails = (university: any) => setSelectedUniversity(university)

  // University registration function
  async function handleUniversitySignup(event: React.FormEvent) {
    event.preventDefault()

    const email = formEmail
    const password = formPassword
    const name = formUniversityName
    const region = formRegion

    try {
      setIsLoading(true)
      
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCred.user.uid
      // 2. Save university data in Realtime Database
      
      
      await set(ref(realtimeDb, "universities/" + uid), {
        id: uid,
        name,
        region,
        zone: region, // Add zone field for login page compatibility
        email,
        createdBy: uid,
        status: "competing",
        isCompeting: true, // Automatically set as competing when they sign up
        sports: [],
        members: 0,
        wins: 0,
        losses: 0,
        points: 0,
        description: `${name} Hindu Society`,
        tournamentDate: region === "NZ+CZ" ? "Nov 22, 2025" : "Nov 23, 2025",
        createdAt: Date.now(),
        lastUpdated: Date.now()
      })
      
      alert("University registered successfully! You can now log in.")
      
      // Reset form
      setFormEmail("")
      setFormPassword("")
      setFormUniversityName("")
      setFormRegion("")
      setShowRegistrationForm(false)
    } catch (error: any) {
      
      // 🎯 Friendly Firebase error handling
      if (error.code === "auth/email-already-in-use") {
        alert("⚠️ This university email has already been registered. Please log in instead.")
      } else if (error.code === "auth/invalid-email") {
        alert("❌ Please enter a valid email address.")
      } else if (error.code === "auth/weak-password") {
        alert("🔒 Your password is too weak. Please use at least 6 characters.")
      } else if (error.code === "auth/network-request-failed") {
        alert("🌐 Network error. Please check your internet connection and try again.")
      } else {
        alert("❌ Something went wrong during registration. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="py-8 sm:py-12 px-4">
        <div className="container mx-auto">
          {/* University Registration Form */}
          {showRegistrationForm && (
            <Card className="max-w-2xl mx-auto mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-blue-900 flex items-center justify-center">
                  <Plus className="w-6 h-6 mr-2" />
                  Register New University
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUniversitySignup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="universityName">University Name</Label>
                      <Input
                        id="universityName"
                        type="text"
                        value={formUniversityName}
                        onChange={(e) => setFormUniversityName(e.target.value)}
                        placeholder="Enter university name"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Select value={formRegion} onValueChange={setFormRegion} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                          <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="Enter university email"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register University"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegistrationForm(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Add University Button */}
          {!showRegistrationForm && (
            <div className="text-center mb-8">
              <Button
                onClick={() => router.push('/register')}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register New University
              </Button>
              
              {/* Admin: Initialize Universities Button */}
              {universitiesData.length === 0 && (
                <div className="mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/initialize-universities');
                        const result = await response.json();
                        if (result.success) {
                          alert(`✅ All ${result.count} NHSF universities have been added!`);
                        } else {
                          alert('❌ Error: ' + result.error);
                        }
                      } catch (error) {
                        alert('❌ Network error: ' + error);
                      }
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Initialize All NHSF Universities
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Zonal Tournaments
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4 sm:px-0">
              Join us for the NHSF (UK) Dharmic Games Zonal Tournaments featuring the <strong>North & Central Zone</strong> (November 22, 2025) and <strong>London & South Zone</strong> (November 23, 2025). Universities are currently registering for their preferred sports.
            </p>
          </div>

          {/* Venue Information for NZ+CZ */}
          {selectedTournament === 'NZ+CZ' && (
            <Card className="mb-8 bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  North & Central Zone - Venue Information
                </CardTitle>
                <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">
                    <strong>📍 Venue:</strong> {venueInfo['NZ+CZ'].name}<br/>
                    <strong>📍 Address:</strong> {venueInfo['NZ+CZ'].address}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-800 mb-3">Tournament Status</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>NHSF Affiliated Universities:</strong> 23 universities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Venue:</strong> {venueInfo['NZ+CZ'].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Timing:</strong> Confirmed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span><strong>Competing Universities:</strong> {totalCompetingUniversities} of 23 confirmed</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-red-800 mb-3">Venue Availability</h4>
                    <div className="space-y-2 text-sm">
                      {venueInfo['NZ+CZ'].availability.map((facility, index) => (
                        <div key={index} className="flex justify-between">
                          <span><strong>{facility.facility}:</strong></span>
                          <span className="text-orange-600">{facility.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-3">Available Slots</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-red-700">Morning (AM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['NZ+CZ'].slots.morning.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-red-700">Afternoon (PM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['NZ+CZ'].slots.afternoon.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Sport selections are currently "TBD" (To Be Determined) as registration forms are pending submission to university chapters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venue Information for LZ+SZ */}
          {selectedTournament === 'LZ+SZ' && (
            <Card className="mb-8 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  London & South Zone - Venue Information
                </CardTitle>
                <div className="mt-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">
                    <strong>📍 Venue:</strong> {venueInfo['LZ+SZ'].name}<br/>
                    <strong>📍 Address:</strong> {venueInfo['LZ+SZ'].address}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-3">Tournament Status</h4>
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>University List:</strong> Confirmed ({totalRegisteredUniversities} universities)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Venue:</strong> {venueInfo['LZ+SZ'].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span><strong>Timing:</strong> Confirmed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span><strong>Sport Selections:</strong> Pending form submission</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span><strong>Competing Universities:</strong> {totalCompetingUniversities} of {totalRegisteredUniversities} confirmed</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-blue-800 mb-3">Venue Availability</h4>
                    <div className="space-y-2 text-sm">
                      {venueInfo['LZ+SZ'].availability.map((facility, index) => (
                        <div key={index} className="flex justify-between">
                          <span><strong>{facility.facility}:</strong></span>
                          <span className="text-orange-600">{facility.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-3">Available Slots</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Morning (AM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['LZ+SZ'].slots.morning.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Afternoon (PM):</span>
                        <ul className="ml-4 mt-1 space-y-1">
                          {venueInfo['LZ+SZ'].slots.afternoon.map((slot, index) => (
                            <li key={index}>• {slot}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note:</strong> Sport selections are currently "TBD" (To Be Determined) as registration forms are pending submission to university chapters.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tournament Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              variant={selectedTournament === "all" ? "default" : "outline"}
              onClick={() => setSelectedTournament("all")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "all"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  : ""
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>All Tournaments ({universitiesData.length})</span>
            </Button>

            <Button
              variant={selectedTournament === "NZ+CZ" ? "default" : "outline"}
              onClick={() => setSelectedTournament("NZ+CZ")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "NZ+CZ"
                  ? "bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white"
                  : "border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>North & Central (Nov 22) ({universitiesData.filter(uni => uni.zone === "NZ+CZ").length})</span>
            </Button>

            <Button
              variant={selectedTournament === "LZ+SZ" ? "default" : "outline"}
              onClick={() => setSelectedTournament("LZ+SZ")}
              className={`flex items-center space-x-2 ${
                selectedTournament === "LZ+SZ"
                  ? "bg-gradient-to-r from-blue-500 to-yellow-500 hover:from-blue-600 hover:to-yellow-600 text-white"
                  : "border-blue-300 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>London & South (Nov 23) ({universitiesData.filter(uni => uni.zone === "LZ+SZ").length})</span>
            </Button>
          </div>

          {/* Filter Status */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredUniversities.length} universities
              {selectedTournament !== "all" && ` in ${selectedTournament === "NZ+CZ" ? "North & Central Zone" : "London & South Zone"}`}
            </p>
            
          </div>

          {/* Universities Grid */}
          {loadingUniversities ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading teams...</p>
            </div>
          ) : (
            <div className="space-y-12 mb-8 sm:mb-12">
              {/* Competing Universities Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trophy className="w-6 h-6 text-green-600 mr-2" />
                    Competing Universities ({competingUniversitiesList.length})
                  </h2>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Active
                  </Badge>
                </div>
                {competingUniversitiesList.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {competingUniversitiesList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((university) => (
                        <UniversityCard
                          key={university.id}
                          university={university}
                          onViewDetails={handleViewDetails}
                          showAdminControls={false}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No universities are currently competing</p>
                    <p className="text-sm text-gray-500 mt-2">Universities will appear here once they register for sports</p>
                  </div>
                )}
              </div>

              {/* Non-Competing Universities Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="w-6 h-6 text-gray-600 mr-2" />
                    Affiliated Universities ({filteredUniversities.length - competingUniversitiesList.length})
                  </h2>
                  <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                    Affiliated
                  </Badge>
                </div>
                {(filteredUniversities.length - competingUniversitiesList.length) > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {filteredUniversities
                      .filter(uni => !competingUniversitiesList.includes(uni))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((university) => (
                        <UniversityCard
                          key={university.id}
                          university={university}
                          onViewDetails={handleViewDetails}
                          showAdminControls={false}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">All registered universities are competing</p>
                    <p className="text-sm text-gray-500 mt-2">Great participation!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8">
            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalPlayers}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Players</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalWins}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Wins</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalGames}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Games Played</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold">{totalPoints.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs sm:text-sm text-gray-600">Total Points</p>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>
                    All universities are automatically sorted alphabetically and grouped by their tournament zones.
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