"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase-context"
import { checkAdminStatus, logAdminAccess } from "@/lib/admin-auth"
import { ref, onValue, update, get, push, set, remove } from "firebase/database"
import { collection, getDocs, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore"
import { realtimeDb, db } from "@/lib/firebase"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/ui/admin-sidebar"
import { LiveScoreAdmin } from "@/components/live-score-admin"
import { DynamicUpdateStatus } from "@/components/dynamic-update-status"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Users, 
  Trophy, 
  Settings, 
  LogOut, 
  BarChart3,
  PlayCircle,
  Crown,
  GraduationCap,
  Gamepad2,
  UserCheck,
  Target,
  Zap,
  Edit,
  Save,
  CheckCircle,
  XCircle,
  X,
  Search,
  Filter,
  Download,
  FileText,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  TrendingUp,
  Activity,
  Clock,
  Star,
  Award,
  UserPlus,
  Building2,
  BookOpen,
  Target as TargetIcon,
  Flame,
  Globe,
  Database,
  Wifi,
  WifiOff
} from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading, signOut } = useFirebase()
  const [activeTab, setActiveTab] = useState("overview")
  const [loadingData, setLoadingData] = useState(false)
  const [universities, setUniversities] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [adminRequests, setAdminRequests] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedZone, setSelectedZone] = useState("ALL")
  const [showNonCompeting, setShowNonCompeting] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string, action?: string} | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingMatch, setEditingMatch] = useState<any>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [adminCheck, setAdminCheck] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [firebaseAvailable, setFirebaseAvailable] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const mountedRef = useRef(false)
  
  // Admin management states
  const [showAddUniversity, setShowAddUniversity] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)
  const [editingUniversity, setEditingUniversity] = useState<any>(null)
  const [admins, setAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<string | null>(null)
  const [editAdminForm, setEditAdminForm] = useState<any>({})
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '', role: 'admin', zones: [] as string[] })
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    email: '',
    zone: 'NZ+CZ',
    sports: [] as string[],
    status: 'approved'
  })
  const [newPlayer, setNewPlayer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    university: '',
    sport: '',
    emergencyContact: {
      name: '',
      relation: '',
      phone: '',
      email: ''
    },
    medicalInfo: {
      hasAllergies: false,
      allergies: '',
      hasMedicalConditions: false,
      medicalConditions: ''
    }
  })

  // Set mounted flag
  useEffect(() => {
    mountedRef.current = true
  }, [])

  // Check admin status on mount (also check admins collection via API)
  useEffect(() => {
    if (!loading && user && user.email) {
      console.log('🔐 Checking admin status for user:', user.email)
      
      // First check with current user data
      let adminStatus = checkAdminStatus(user)
      console.log('🔐 Admin status result (initial):', adminStatus)
      
      // Also check admins collection via API for most up-to-date role
      const checkWithApi = async () => {
        try {
          const roleRes = await fetch(`/api/get-admin-role?email=${encodeURIComponent(user.email!)}`)
          if (roleRes.ok) {
            const roleData = await roleRes.json()
            if (roleData.success && roleData.role) {
              // Override role from admins collection if it exists (more authoritative)
              const userWithRole = {
                ...user,
                role: roleData.role
              }
              adminStatus = checkAdminStatus(userWithRole)
              console.log('🔐 Admin status result (after API check):', adminStatus)
            }
          }
        } catch (e) {
          console.log('⚠️ Could not check admins collection in dashboard:', e)
        }
        
        setAdminCheck(adminStatus)
        
        // Double-check: if still not admin after API check, redirect
        if (!adminStatus.isAdmin) {
          console.log('❌ User is not an admin after API check, redirecting to /admin')
          console.log('🔐 Admin status details:', adminStatus)
          router.push('/admin')
          return
        }
        
        // Log admin access
        logAdminAccess(user, adminStatus)
      }
      
      checkWithApi()
    } else if (!loading && !user) {
      // No user, redirect to login
      router.push('/admin/login')
    }
  }, [user, loading, router])

  // Simple tab switching with basic event listener
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleTabChange = (event: any) => {
      console.log('🔄 Tab change event received:', event.detail)
      setActiveTab(event.detail)
    }

    // Check URL hash on mount
    const hash = window.location.hash.replace('#', '')
    if (hash && ['overview', 'universities', 'players', 'matches', 'scoring', 'admin-requests', 'settings'].includes(hash)) {
      console.log('🔄 Setting tab from URL hash:', hash)
      setActiveTab(hash)
    }

    // Add event listener with error handling
    try {
      window.addEventListener('adminTabChange', handleTabChange)
    } catch (error) {
      console.log('❌ Failed to add event listener:', error)
    }

    return () => {
      try {
        window.removeEventListener('adminTabChange', handleTabChange)
      } catch (error) {
        console.log('❌ Failed to remove event listener:', error)
      }
    }
  }, [])

  // Set up real-time listeners
  useEffect(() => {
    if (!user || !adminCheck?.isAdmin) return

    console.log('🔄 Setting up real-time listeners for admin dashboard')
    setRealtimeConnected(true)

    // Universities listener - use Firestore
    const universitiesRef = collection(db, "universities")
    const q = query(universitiesRef, orderBy("name"))
    
    const universitiesUnsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log('🏛️ Universities data changed in admin dashboard')
        const universitiesList = snapshot.docs.map(doc => ({
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
          status: doc.data().status || "affiliated"
        }))
        
        // Ensure each university has a unique id
        const universitiesWithIds = universitiesList.map((uni, index) => ({
          ...uni,
          id: uni.id || `uni-${index}-${Date.now()}`
        }))
        setUniversities(universitiesWithIds)
        console.log('📊 Universities updated:', universitiesWithIds.length)
        console.log('📊 Sample university:', universitiesWithIds[0])
      } catch (error) {
        console.error('❌ Error in universities listener:', error)
      }
    }, (error) => {
      console.error('❌ Universities listener error:', error)
    })

    // Players listener - try multiple approaches
    const playersRef = ref(realtimeDb, 'players')
    const playersUnsubscribe = onValue(playersRef, (snapshot) => {
      try {
        console.log('👥 Players listener triggered')
        console.log('👥 User auth state:', user?.email, 'Authenticated:', !!user)
        console.log('👥 Admin check result:', adminCheck)
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const playersList = Object.values(data || {}) as any[]
          // Ensure each player has a unique id
          const playersWithIds = playersList.map((player, index) => ({
            ...player,
            id: player.id || `player-${index}-${Date.now()}`
          }))
          setPlayers(playersWithIds)
          console.log('👥 Players updated:', playersWithIds.length)
          console.log('👥 Sample player:', playersWithIds[0])
        } else {
          console.log('👥 No players data found')
          setPlayers([])
        }
      } catch (error) {
        console.error('❌ Error in players listener:', error)
        console.error('❌ Error details:', error)
      }
    }, (error) => {
      console.error('❌ Players listener error:', error)
      console.error('❌ Error code:', error.code)
      console.error('❌ Error message:', error.message)
      
      if (error.code === 'PERMISSION_DENIED') {
        console.error('❌ Permission denied for players - checking auth state')
        console.error('❌ User:', user?.email)
        console.error('❌ User authenticated:', !!user)
        console.error('❌ Admin check:', adminCheck)
        
        // Try to load players from universities instead
        console.log('🔄 Attempting to load players from universities...')
        loadPlayersFromUniversities()
        
        setMessage({type: 'error', text: 'Permission denied for players data. Loading from universities instead.'})
      }
    })

    // Matches listener
    const matchesRef = ref(realtimeDb, 'matches')
    const matchesUnsubscribe = onValue(matchesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const matchesList = Object.values(data || {}) as any[]
          // Ensure each match has a unique id
          const matchesWithIds = matchesList.map((match, index) => ({
            ...match,
            id: match.id || `match-${index}-${Date.now()}`
          }))
          setMatches(matchesWithIds)
          console.log('🏆 Matches updated:', matchesWithIds.length)
          console.log('🏆 Sample match:', matchesWithIds[0])
        } else {
          setMatches([])
        }
      } catch (error) {
        console.error('❌ Error in matches listener:', error)
      }
    }, (error) => {
      console.error('❌ Matches listener error:', error)
    })

    // Admin requests - load via API (Admin SDK) instead of client RTDB
    const fetchAdminRequests = async () => {
      try {
        if (!adminCheck?.isSuperAdmin) return
        const res = await fetch('/api/admin-requests')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setAdminRequests(Array.isArray(data.requests) ? data.requests : (data.requests || data))
      } catch (e) {
        console.warn('Failed to fetch admin requests:', e)
      }
    }
    fetchAdminRequests()

      const interval = adminCheck?.isSuperAdmin ? setInterval(() => {
        fetchAdminRequests()
        fetchAdmins()
      }, 15000) : null
      
      // Load admins on mount
      if (adminCheck?.isSuperAdmin) {
        fetchAdmins()
      }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time listeners')
      setRealtimeConnected(false)
      try {
        universitiesUnsubscribe()
        playersUnsubscribe()
        matchesUnsubscribe()
        if (interval) clearInterval(interval as any)
      } catch (error) {
        console.error('❌ Error cleaning up listeners:', error)
      }
    }
  }, [user, adminCheck?.isAdmin, adminCheck?.isSuperAdmin])

  const loadPlayersFromUniversities = async () => {
    try {
      console.log('🔄 Loading players from universities...')
      const allPlayers: any[] = []
      
      // Get all universities
      const universitiesRef = ref(realtimeDb, 'universities')
      const universitiesSnapshot = await get(universitiesRef)
      
      if (universitiesSnapshot.exists()) {
        const universitiesData = universitiesSnapshot.val()
        
        // Iterate through each university
        for (const [uniId, uniData] of Object.entries(universitiesData)) {
          const university = uniData as any
          
          // Check if university has sports
          if (university.sports) {
            for (const [sportId, sportData] of Object.entries(university.sports)) {
              const sport = sportData as any
              
              // Check if sport has teams
              if (sport.teams) {
                for (const [teamId, teamData] of Object.entries(sport.teams)) {
                  const team = teamData as any
                  
                  // Check if team has players
                  if (team.players) {
                    for (const [playerId, playerData] of Object.entries(team.players)) {
                      const player = playerData as any
                      allPlayers.push({
                        ...player,
                        id: playerId,
                        universityId: uniId,
                        universityName: university.name,
                        sportId: sportId,
                        teamId: teamId
                      })
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      console.log('👥 Players loaded from universities:', allPlayers.length)
      setPlayers(allPlayers)
    } catch (error: any) {
      console.error('❌ Error loading players from universities:', error)
    }
  }

  const loadData = async () => {
    // Check if user is superadmin
    if (!adminCheck?.isSuperAdmin) {
      setMessage({type: 'error', text: 'Only Super Admins can perform this action.'})
      return
    }
    try {
      setLoadingData(true)
      console.log('🔄 Loading admin data...')
      console.log('🔐 Current user for data loading:', user)
      console.log('🔐 Firebase auth state:', { user: user?.email, loading })
      
      // Test Firebase connection first
      try {
        console.log('🔄 Testing Firebase connection...')
        console.log('🔐 User auth state:', user?.email, 'Authenticated:', !!user)
        console.log('🔐 Firebase auth token:', await user?.getIdToken())
        
        const testRef = ref(realtimeDb, 'test')
        const testSnapshot = await get(testRef)
        console.log('✅ Firebase connection test successful')
        console.log('📊 Test data:', testSnapshot.exists() ? testSnapshot.val() : 'No test data')
        setFirebaseAvailable(true)
      } catch (testError: any) {
        console.error('❌ Firebase connection test failed:', testError)
        console.error('❌ Error code:', testError.code)
        console.error('❌ Error message:', testError.message)
        console.error('❌ Error details:', testError)
        
        setFirebaseAvailable(false)
        
        if (testError.code === 'PERMISSION_DENIED') {
          setMessage({type: 'error', text: 'Permission denied. Please check your admin access or contact support.'})
        } else if (testError.code === 'UNAVAILABLE') {
          setMessage({type: 'error', text: 'Firebase service unavailable. Please try again later.'})
        } else if (testError.message?.includes('auth')) {
          setMessage({type: 'error', text: 'Authentication error. Please log out and log back in.'})
        } else {
          setMessage({type: 'error', text: `Firebase connection failed: ${testError.message}`})
        }
        return
      }
      
      // Load universities from Firestore
      console.log('🔄 Loading universities from Firestore...')
      const universitiesRef = collection(db, "universities")
      const q = query(universitiesRef, orderBy("name"))
      const universitiesSnapshot = await getDocs(q)
      const universitiesData = universitiesSnapshot.docs.map(doc => ({
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
        status: doc.data().status || "affiliated"
      }))
      setUniversities(universitiesData)
      console.log('✅ Universities loaded:', universitiesData.length)
      
      // Load players
      console.log('🔄 Loading players...')
      const playersRef = ref(realtimeDb, 'players')
      const playersSnapshot = await get(playersRef)
      const playersData = playersSnapshot.exists() ? Object.values(playersSnapshot.val()) : []
      setPlayers(playersData)
      console.log('✅ Players loaded:', playersData.length)
      
      // Also try to load players from universities
      console.log('🔄 Also checking for players in universities...')
      for (const uni of universitiesData) {
        if (uni.players && Array.isArray(uni.players)) {
          console.log(`📊 Found ${uni.players.length} players in ${uni.name}`)
          setPlayers(prev => [...prev, ...uni.players])
        }
      }
      
      // Load matches
      console.log('🔄 Loading matches...')
      const matchesRef = ref(realtimeDb, 'matches')
      const matchesSnapshot = await get(matchesRef)
      const matchesData = matchesSnapshot.exists() ? Object.values(matchesSnapshot.val()) : []
      setMatches(matchesData)
      console.log('✅ Matches loaded:', matchesData.length)
      
      // Load admin requests (for superadmins)
      if (adminCheck?.isSuperAdmin) {
        console.log('🔄 Loading admin requests...')
        const adminRequestsRef = ref(realtimeDb, 'adminRequests')
        const adminRequestsSnapshot = await get(adminRequestsRef)
        const adminRequestsData = adminRequestsSnapshot.exists() ? Object.values(adminRequestsSnapshot.val()) : []
        setAdminRequests(adminRequestsData)
        console.log('✅ Admin requests loaded:', adminRequestsData.length)
      }
      
      console.log('✅ Admin data loading completed')
    } catch (error: any) {
      console.error('❌ Error loading admin data:', error)
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      
      if (error.message?.includes('Permission denied')) {
        setMessage({type: 'error', text: 'Permission denied. Please check your admin access or contact support.'})
      } else if (error.message?.includes('Failed to fetch')) {
        setMessage({type: 'error', text: 'Network error. Please check your connection.'})
      } else {
        setMessage({type: 'error', text: `Failed to load data: ${error.message}`})
      }
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddUniversity = async () => {
    try {
      setSaving(true)
      const universityRef = ref(realtimeDb, 'universities')
      const newUniRef = push(universityRef)
      await set(newUniRef, {
        ...newUniversity,
        id: newUniRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setMessage({type: 'success', text: 'University added successfully!'})
      setShowAddUniversity(false)
      setNewUniversity({
        name: '',
        email: '',
        zone: 'NZ+CZ',
        sports: [],
        status: 'approved'
      })
    } catch (error) {
      console.error('Error adding university:', error)
      setMessage({type: 'error', text: 'Failed to add university'})
    } finally {
      setSaving(false)
    }
  }

  const handleAddPlayer = async () => {
    try {
      setSaving(true)
      const playerRef = ref(realtimeDb, 'players')
      const newPlayerRef = push(playerRef)
      await set(newPlayerRef, {
        ...newPlayer,
        id: newPlayerRef.key,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setMessage({type: 'success', text: 'Player added successfully!'})
      setShowAddPlayer(false)
      setNewPlayer({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        university: '',
        sport: '',
        emergencyContact: {
          name: '',
          relation: '',
          phone: '',
          email: ''
        },
        medicalInfo: {
          hasAllergies: false,
          allergies: '',
          hasMedicalConditions: false,
          medicalConditions: ''
        }
      })
    } catch (error) {
      console.error('Error adding player:', error)
      setMessage({type: 'error', text: 'Failed to add player'})
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUniversity = async () => {
    if (!editingUniversity) return
    
    try {
      setSaving(true)
      const universityRef = ref(realtimeDb, `universities/${editingUniversity.id}`)
      await update(universityRef, {
        ...editingUniversity,
        updatedAt: new Date().toISOString()
      })
      
      setMessage({type: 'success', text: 'University updated successfully!'})
      setEditingUniversity(null)
    } catch (error) {
      console.error('Error updating university:', error)
      setMessage({type: 'error', text: 'Failed to update university'})
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUniversityStatus = async (university: any) => {
    try {
      setSaving(true)
      const newStatus = university.isCompeting ? 'affiliated' : 'competing'
      
      // Update in Firestore
      const universityRef = doc(db, "universities", university.id)
      const updateData = {
        isCompeting: !university.isCompeting,
        status: newStatus,
        lastUpdated: new Date()
      }
      
      await updateDoc(universityRef, updateData)
      
      // Update the local state immediately for better UX
      setUniversities(prevUniversities => 
        prevUniversities.map(uni => 
          uni.id === university.id 
            ? { ...uni, isCompeting: !university.isCompeting, status: newStatus }
            : uni
        )
      )
      
      setMessage({
        type: 'success', 
        text: `${university.name} is now ${newStatus === 'competing' ? 'competing' : 'affiliated'}`
      })
      
      console.log(`✅ University status updated: ${university.name} -> ${newStatus}`)
    } catch (error) {
      console.error('Error toggling university status:', error)
      setMessage({type: 'error', text: 'Failed to update university status'})
    } finally {
      setSaving(false)
    }
  }

  const handleEditMatch = (match: any) => {
    console.log('🔧 Editing match:', match)
    setEditingMatch(match)
    setShowMatchModal(true)
  }

  const handleViewMatch = (match: any) => {
    console.log('👁️ Viewing match:', match)
    setEditingMatch(match)
    setShowMatchModal(true)
  }

  const handleSaveMatch = async () => {
    if (!editingMatch) return

    try {
      setSaving(true)
      console.log('💾 Saving match:', editingMatch)
      
      const matchRef = ref(realtimeDb, `matches/${editingMatch.id}`)
      await update(matchRef, {
        ...editingMatch,
        updatedAt: new Date().toISOString()
      })
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === editingMatch.id ? editingMatch : match
        )
      )
      
      setMessage({
        type: 'success',
        text: 'Match updated successfully!'
      })
      
      setShowMatchModal(false)
      setEditingMatch(null)
    } catch (error) {
      console.error('❌ Error saving match:', error)
      setMessage({
        type: 'error',
        text: 'Failed to save match'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      console.log('🗑️ Deleting match:', matchId)
      
      const matchRef = ref(realtimeDb, `matches/${matchId}`)
      await remove(matchRef) // Properly delete the match node
      
      // Update local state
      setMatches(prevMatches => 
        prevMatches.filter(match => match.id !== matchId)
      )
      
      setMessage({
        type: 'success',
        text: 'Match deleted successfully!'
      })
      
      setShowMatchModal(false)
      setEditingMatch(null)
    } catch (error) {
      console.error('❌ Error deleting match:', error)
      setMessage({
        type: 'error',
        text: 'Failed to delete match'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return
    
    try {
      setSaving(true)
      const playerRef = ref(realtimeDb, `players/${editingPlayer.id}`)
      await update(playerRef, {
        ...editingPlayer,
        updatedAt: new Date().toISOString()
      })
      
      setMessage({type: 'success', text: 'Player updated successfully!'})
      setEditingPlayer(null)
    } catch (error) {
      console.error('Error updating player:', error)
      setMessage({type: 'error', text: 'Failed to update player'})
    } finally {
      setSaving(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      setProcessing(requestId)
      const res = await fetch('/api/admin-requests/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'approve', reviewedBy: user?.email, reviewedAt: new Date().toISOString() })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to approve')
      setMessage({type: 'success', text: 'Admin request approved!'})
      // Refresh list
      const refreshed = await fetch('/api/admin-requests')
      const data = await refreshed.json()
      setAdminRequests(data.requests || [])
    } catch (error) {
      console.error('Error approving request:', error)
      setMessage({type: 'error', text: 'Failed to approve request'})
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessing(requestId)
      const res = await fetch('/api/admin-requests/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject', reviewedBy: user?.email, reviewedAt: new Date().toISOString() })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to reject')
      setMessage({type: 'success', text: 'Admin request rejected!'})
      // Refresh list
      const refreshed = await fetch('/api/admin-requests')
      const data = await refreshed.json()
      setAdminRequests(data.requests || [])
    } catch (error) {
      console.error('Error rejecting request:', error)
      setMessage({type: 'error', text: 'Failed to reject request'})
    } finally {
      setProcessing(null)
    }
  }

  const initializeDatabase = async () => {
    // Check if user is superadmin
    if (!adminCheck?.isSuperAdmin) {
      setMessage({type: 'error', text: 'Only Super Admins can perform this action.'})
      return
    }

    try {
      setInitializing(true)
      const response = await fetch('/api/initialize-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({type: 'success', text: 'Database initialized successfully!'})
      } else {
        setMessage({type: 'error', text: result.error || 'Failed to initialize database'})
      }
    } catch (error) {
      console.error('Error initializing database:', error)
      setMessage({type: 'error', text: 'Failed to initialize database'})
    } finally {
      setInitializing(false)
    }
  }

  // Calculate stats
  const stats = {
    totalUniversities: universities.length,
    totalPlayers: players.length,
    totalMatches: matches.length,
    pendingRequests: adminRequests.filter(req => req.status === 'pending').length,
    approvedRequests: adminRequests.filter(req => req.status === 'approved').length,
    liveMatches: matches.filter(match => match.status === 'live').length,
    completedMatches: matches.filter(match => match.status === 'completed').length,
    upcomingMatches: matches.filter(match => match.status === 'scheduled').length
  }

  const adminName = user?.displayName || user?.email?.split('@')[0] || 'Admin'

  const handleHideFromRecent = async (university: any) => {
    if (!adminCheck?.isSuperAdmin) return
    try {
      const universityRef = doc(db, "universities", university.id)
      await updateDoc(universityRef, { hiddenFromRecent: true, lastUpdated: new Date() })
      setUniversities(prev => prev.map(u => u.id === university.id ? { ...u, hiddenFromRecent: true } : u))
      setMessage({ type: 'success', text: `${university.name} hidden from Recent Activity` })
    } catch (e) {
      console.error('Failed to hide from recent:', e)
      setMessage({ type: 'error', text: 'Failed to update Recent Activity' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/admin/login')
    return null
  }

  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <Button onClick={() => router.push('/admin')}>
            Back to Admin Info
          </Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <AdminSidebar />
        
        <div className="ml-64">
          {/* Header */}
          <div className={`shadow-sm border-b px-6 py-4 ${
            adminCheck?.isSuperAdmin 
              ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-yellow-300' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    adminCheck?.isSuperAdmin 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                      : 'bg-gradient-to-r from-orange-500 to-red-600'
                  }`}>
                    {adminCheck?.isSuperAdmin ? (
                      <Crown className="h-6 w-6 text-white" />
                    ) : (
                      <Shield className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {adminCheck?.isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}
                      </h1>
                      {adminCheck?.isSuperAdmin && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0 px-3 py-1">
                          <Crown className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {!adminCheck?.isSuperAdmin && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 px-3 py-1">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className={`font-medium mt-1 ${
                      adminCheck?.isSuperAdmin ? 'text-amber-700' : 'text-orange-600'
                    }`}>
                      Welcome back, {adminName}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${firebaseAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {firebaseAvailable ? 'Firebase Online' : 'Firebase Offline'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${realtimeConnected ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {realtimeConnected ? 'Live Updates' : 'Offline'}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      await signOut();
                      router.replace('/admin/login');
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  variant="outline"
                  className="text-gray-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {message && (
              <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : message.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : message.type === 'warning' ? 'text-yellow-800' : 'text-green-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className={`grid w-full ${adminCheck?.isSuperAdmin ? 'grid-cols-8' : 'grid-cols-6'}`}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="universities">Universities</TabsTrigger>
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="matches">Matches</TabsTrigger>
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="live-scores">Live Scores</TabsTrigger>
                {adminCheck?.isSuperAdmin && <TabsTrigger value="admin-requests">Admin Requests</TabsTrigger>}
                {adminCheck?.isSuperAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
                      <Building2 className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUniversities}</div>
                      <p className="text-xs text-orange-100">Registered institutions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                      <Users className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalPlayers}</div>
                      <p className="text-xs text-green-100">Active participants</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                      <Trophy className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalMatches}</div>
                      <p className="text-xs text-red-100">Games scheduled</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
                      <Activity className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.liveMatches}</div>
                      <p className="text-xs text-orange-100">Currently playing</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => setShowAddUniversity(true)}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-sm font-medium">Add University</span>
                      </Button>
                      
                      <Button 
                        onClick={() => setShowAddPlayer(true)}
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <UserPlus className="h-6 w-6" />
                        <span className="text-sm font-medium">Add Player</span>
                      </Button>
                      
                      <Button 
                        onClick={loadData}
                        disabled={loadingData}
                        className={`h-20 flex flex-col items-center justify-center space-y-2 ${adminCheck?.isSuperAdmin ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : 'hidden'}`}
                      >
                        {loadingData ? <Loader2 className="h-6 w-6 animate-spin" /> : <RefreshCw className="h-6 w-6" />}
                        <span className="text-sm font-medium">Refresh Data</span>
                      </Button>
                      <Button 
                        onClick={initializeDatabase}
                        disabled={initializing}
                        className={`h-20 flex flex-col items-center justify-center space-y-2 ${adminCheck?.isSuperAdmin ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' : 'hidden'}`}
                      >
                        {initializing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Database className="h-6 w-6" />}
                        <span className="text-sm font-medium">Initialize DB</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {universities.filter(uni => !uni.hiddenFromRecent).slice(0, 3).map((uni, index) => (
                        <div key={uni.id || `uni-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Building2 className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{uni.name}</p>
                            <p className="text-sm text-gray-500">{uni.zone} • {uni.sports?.length || 0} sports</p>
                          </div>
                          <Badge variant="outline">{uni.status}</Badge>
                          {adminCheck?.isSuperAdmin && (
                            <div className="flex items-center space-x-2 ml-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingUniversity(uni)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleHideFromRecent(uni)}>
                                <XCircle className="h-4 w-4 mr-1" /> Hide
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Universities Tab */}
              <TabsContent value="universities" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Universities</h2>
                  <Button onClick={() => setShowAddUniversity(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add University
                  </Button>
                </div>
                
                {/* Search and Filter */}
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search universities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Zones</SelectItem>
                      <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                      <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant={showNonCompeting ? "default" : "outline"}
                    onClick={() => setShowNonCompeting(!showNonCompeting)}
                    className="whitespace-nowrap"
                  >
                    {showNonCompeting ? (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show All
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Show Non-Competing
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {universities
                    .filter(uni => {
                      // Filter by search term
                      const matchesSearch = searchTerm === '' || uni.name.toLowerCase().includes(searchTerm.toLowerCase())
                      
                      // Filter by zone
                      const matchesZone = selectedZone === 'ALL' || uni.zone === selectedZone || uni.region === selectedZone
                      
                      // Filter by competing status
                      const isCompeting = uni.isCompeting === true || uni.status === 'competing'
                      const showThisUniversity = showNonCompeting ? true : isCompeting
                      
                      return matchesSearch && matchesZone && showThisUniversity
                    })
                    .map((uni, index) => (
                    <Card key={uni.id || `uni-${index}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{uni.name}</CardTitle>
                          <div className="flex space-x-2">
                            <Badge variant="outline">{uni.zone}</Badge>
                            <Badge variant={uni.isCompeting ? "default" : "secondary"}>
                              {uni.isCompeting ? "Competing" : "Not Competing"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{uni.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{uni.zone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Gamepad2 className="h-4 w-4" />
                            <span>{uni.sports?.join(', ') || 'No sports'}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingUniversity(uni)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant={uni.isCompeting ? "destructive" : "default"}
                            onClick={() => handleToggleUniversityStatus(uni)}
                            disabled={saving}
                          >
                            {uni.isCompeting ? (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Remove from Competing
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Add to Competing
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Players Tab */}
              <TabsContent value="players" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Players ({players.length})</h2>
                  <Button onClick={() => setShowAddPlayer(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </div>
                
                {/* Debug info - Superadmin only */}
                {adminCheck?.isSuperAdmin && (
                  <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Debug: {players.length} players loaded</p>
                  <p className="text-sm text-gray-600">Loading: {loadingData ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Firebase Available: {firebaseAvailable ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Real-time Connected: {realtimeConnected ? 'Yes' : 'No'}</p>
                  <p className="text-sm text-gray-600">Universities: {universities.length}</p>
                  <p className="text-sm text-gray-600">Matches: {matches.length}</p>
                  <p className="text-sm text-gray-600">User: {user?.email || 'Not logged in'}</p>
                  <p className="text-sm text-gray-600">Admin Status: {adminCheck?.isAdmin ? 'Yes' : 'No'}</p>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      onClick={loadData}
                      disabled={loadingData}
                      size="sm"
                    >
                      {loadingData ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Refresh Data
                    </Button>
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🧪 Testing Firebase connection...')
                          const testRef = ref(realtimeDb, 'test')
                          await get(testRef)
                          console.log('✅ Firebase test successful')
                          setMessage({type: 'success', text: 'Firebase connection is working!'})
                        } catch (error: any) {
                          console.error('❌ Firebase test failed:', error)
                          setMessage({type: 'error', text: `Firebase test failed: ${error.message}`})
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Test Firebase
                    </Button>
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🧪 Testing players access...')
                          const playersRef = ref(realtimeDb, 'players')
                          const snapshot = await get(playersRef)
                          console.log('✅ Players access successful')
                          console.log('📊 Players data:', snapshot.exists() ? snapshot.val() : 'No data')
                          setMessage({type: 'success', text: 'Players access is working!'})
                        } catch (error: any) {
                          console.error('❌ Players access failed:', error)
                          setMessage({type: 'error', text: `Players access failed: ${error.message}`})
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Test Players
                    </Button>
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🧪 Testing fallback players loading...')
                          await loadPlayersFromUniversities()
                          setMessage({type: 'success', text: 'Fallback players loading successful!'})
                        } catch (error: any) {
                          console.error('❌ Fallback players loading failed:', error)
                          setMessage({type: 'error', text: `Fallback loading failed: ${error.message}`})
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Load from Universities
                    </Button>
                    <Button 
                      onClick={async () => {
                        try {
                          console.log('🔐 Adding user to admins node...')
                          if (!user) {
                            setMessage({type: 'error', text: 'No user logged in'})
                            return
                          }
                          
                          const adminRef = ref(realtimeDb, `admins/${user.uid}`)
                          await set(adminRef, {
                            email: user.email,
                            role: 'superadmin',
                            addedAt: new Date().toISOString(),
                            addedBy: 'self'
                          })
                          
                          console.log('✅ Added to admins node successfully')
                          setMessage({type: 'success', text: 'Added to admins node! You now have full admin access.'})
                        } catch (error: any) {
                          console.error('❌ Failed to add to admins node:', error)
                          setMessage({type: 'error', text: `Failed to add to admins: ${error.message}`})
                        }
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Add to Admins
                    </Button>
                  </div>
                </div>
                )}
                
                {players.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Found</h3>
                      <p className="text-gray-600 mb-4">No players have been registered yet.</p>
                      <Button onClick={() => setShowAddPlayer(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Player
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {players.map((player, index) => (
                    <Card key={player.id || `player-${index}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {player.firstName} {player.lastName}
                        </CardTitle>
                        <Badge variant="outline">{player.sport}</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{player.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{player.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Building2 className="h-4 w-4" />
                            <span>{player.university}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingPlayer(player)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Matches</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Match
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((match, index) => (
                    <Card key={match.id || `match-${index}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{match.title || match.sport || 'Match'}</CardTitle>
                        {match.status && <Badge variant="outline">{match.status}</Badge>}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{match.teamA || match.team1}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium">{match.teamB || match.team2}</span>
                          </div>
                          {match.date && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{match.date}</span>
                            </div>
                          )}
                          {match.time && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{match.time}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditMatch(match)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewMatch(match)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Scoring Tab */}
              <TabsContent value="scoring" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Live Scoring</h2>
                  <Button>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Live Match
                  </Button>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Live Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Live Matches</h3>
                      <p className="text-gray-600">Start a match to begin live scoring</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Live Scores Tab */}
              <TabsContent value="live-scores" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Live Score Management</h2>
                  <Badge className="bg-green-500 text-white animate-pulse">LIVE</Badge>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-800 mb-2">🎯 Tournament Day Instructions</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p><strong>During Matches:</strong> Set status to "Live" and update scores in real-time</p>
                    <p><strong>After Matches:</strong> Set status to "Completed" and enter final scores</p>
                    <p><strong>Paused Matches:</strong> Use "Paused" status for breaks or delays</p>
                    <p><strong>All changes update everywhere instantly!</strong></p>
                  </div>
                </div>
                
                {/* Dynamic Update Status - Superadmin only */}
                {adminCheck?.isSuperAdmin && (
                  <div className="mb-6">
                    <DynamicUpdateStatus showDetails={true} />
                  </div>
                )}
                
                <LiveScoreAdmin currentZone="all" />
              </TabsContent>

              {/* Admin Requests Tab (Superadmin only) */}
              {adminCheck?.isSuperAdmin && (
                <TabsContent value="admin-requests" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Admin Requests</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminRequests.map((request, index) => (
                      <Card key={request.id || `request-${index}`} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{request.name}</CardTitle>
                          <Badge variant={request.status === 'pending' ? 'default' : request.status === 'approved' ? 'secondary' : 'destructive'}>
                            {request.status}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{request.email}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Building2 className="h-4 w-4" />
                              <span>{request.university || 'No university'}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{request.zones?.join(', ') || 'No zones'}</span>
                            </div>
                            {request.reason && (
                              <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2 mt-4">
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveRequest(request.id)}
                                disabled={processing === request.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {processing === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectRequest(request.id)}
                                disabled={processing === request.id}
                              >
                                {processing === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* User Management Tab (Superadmin only) */}
              {adminCheck?.isSuperAdmin && (
                <TabsContent value="management" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Admin Management</h2>
                    <Button onClick={() => setShowAddAdmin(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>

                  {/* Admin Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{admins.length}</p>
                            <p className="text-sm text-gray-600">Total Admins</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-2xl font-bold">{admins.filter((a: any) => a.role === 'super_admin').length}</p>
                            <p className="text-sm text-gray-600">Super Admins</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-2xl font-bold">{admins.filter((a: any) => a.role === 'admin').length}</p>
                            <p className="text-sm text-gray-600">Regular Admins</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Admins List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="h-5 w-5" />
                        <span>Admins</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingAdmins ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
                          <p className="text-gray-600">Loading admins...</p>
                        </div>
                      ) : admins.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Admins Found</h3>
                          <p className="text-gray-600">Add your first admin to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {admins.map((admin: any) => (
                            <Card key={admin.email} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      admin.role === 'super_admin' 
                                        ? 'bg-gradient-to-r from-yellow-500 to-amber-600' 
                                        : 'bg-gradient-to-r from-orange-500 to-red-600'
                                    }`}>
                                      {admin.role === 'super_admin' ? (
                                        <Crown className="h-5 w-5 text-white" />
                                      ) : (
                                        <Shield className="h-5 w-5 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <h3 className="font-semibold">{admin.name || admin.email}</h3>
                                        <Badge className={
                                          admin.role === 'super_admin'
                                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                                            : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                                        }>
                                          {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600">{admin.email}</p>
                                      <p className="text-xs text-gray-500">
                                        Zones: {admin.zones?.join(', ') || 'All'} | 
                                        Approved: {admin.approvedAt ? new Date(admin.approvedAt).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {editingAdmin === admin.email ? (
                                      <>
                                        <Select
                                          value={editAdminForm.role || admin.role}
                                          onValueChange={(value) => setEditAdminForm({ ...editAdminForm, role: value })}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="super_admin">Super Admin</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          size="sm"
                                          onClick={async () => {
                                            try {
                                              setProcessing(admin.email)
                                              const res = await fetch('/api/admin-management', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  email: admin.email,
                                                  role: editAdminForm.role || admin.role,
                                                  name: editAdminForm.name || admin.name,
                                                  zones: editAdminForm.zones || admin.zones,
                                                }),
                                              })
                                              if (!res.ok) throw new Error('Failed to update admin')
                                              setMessage({ type: 'success', text: 'Admin updated successfully' })
                                              setEditingAdmin(null)
                                              setEditAdminForm({})
                                              fetchAdmins()
                                            } catch (e: any) {
                                              setMessage({ type: 'error', text: e.message || 'Failed to update admin' })
                                            } finally {
                                              setProcessing(null)
                                            }
                                          }}
                                          disabled={processing === admin.email}
                                        >
                                          {processing === admin.email ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Save className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingAdmin(null)
                                            setEditAdminForm({})
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingAdmin(admin.email)
                                            setEditAdminForm({ role: admin.role, name: admin.name, zones: admin.zones })
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-1" />
                                          Edit
                                        </Button>
                                        {admin.role !== 'super_admin' && admin.email !== user?.email && (
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={async () => {
                                              if (!confirm(`Are you sure you want to delete ${admin.email}?`)) return
                                              try {
                                                setProcessing(admin.email)
                                                const res = await fetch(`/api/admin-management?email=${encodeURIComponent(admin.email)}`, {
                                                  method: 'DELETE',
                                                })
                                                if (!res.ok) throw new Error('Failed to delete admin')
                                                setMessage({ type: 'success', text: 'Admin deleted successfully' })
                                                fetchAdmins()
                                              } catch (e: any) {
                                                setMessage({ type: 'error', text: e.message || 'Failed to delete admin' })
                                              } finally {
                                                setProcessing(null)
                                              }
                                            }}
                                            disabled={processing === admin.email}
                                          >
                                            {processing === admin.email ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add Admin Modal */}
                  {showAddAdmin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <Card className="bg-white p-6 rounded-lg max-w-md w-full m-4">
                        <CardHeader>
                          <CardTitle>Add New Admin</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newAdmin.email}
                              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                              placeholder="admin@example.com"
                            />
                          </div>
                          <div>
                            <Label>Password</Label>
                            <Input
                              type="password"
                              value={newAdmin.password}
                              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                              placeholder="Enter password"
                            />
                          </div>
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={newAdmin.name}
                              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                              placeholder="Admin Name"
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Select
                              value={newAdmin.role}
                              onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              className="flex-1"
                              onClick={async () => {
                                try {
                                  setProcessing('new-admin')
                                  const res = await fetch('/api/admin-management', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(newAdmin),
                                  })
                                  if (!res.ok) {
                                    const errorData = await res.json()
                                    throw new Error(errorData.error || 'Failed to create admin')
                                  }
                                  setMessage({ type: 'success', text: 'Admin created successfully' })
                                  setShowAddAdmin(false)
                                  setNewAdmin({ email: '', password: '', name: '', role: 'admin', zones: [] })
                                  fetchAdmins()
                                } catch (e: any) {
                                  setMessage({ type: 'error', text: e.message || 'Failed to create admin' })
                                } finally {
                                  setProcessing(null)
                                }
                              }}
                              disabled={processing === 'new-admin' || !newAdmin.email || !newAdmin.password}
                            >
                              {processing === 'new-admin' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                              Create Admin
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddAdmin(false)
                                setNewAdmin({ email: '', password: '', name: '', role: 'admin', zones: [] })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Settings Tab */}
              {adminCheck?.isSuperAdmin && (
                <TabsContent value="settings" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Settings</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Database Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button 
                          onClick={initializeDatabase}
                          disabled={initializing}
                          className="w-full"
                        >
                          {initializing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                          Initialize Database
                        </Button>
                        <Button 
                          onClick={loadData}
                          disabled={loadingData}
                          variant="outline"
                          className="w-full"
                        >
                          {loadingData ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Refresh Data
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>System Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Firebase Connection</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${firebaseAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm">{firebaseAvailable ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Real-time Updates</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                            <span className="text-sm">{realtimeConnected ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add University Modal */}
      <Dialog open={showAddUniversity} onOpenChange={setShowAddUniversity}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New University</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">University Name</Label>
                <Input
                  id="name"
                  value={newUniversity.name}
                  onChange={(e) => setNewUniversity({...newUniversity, name: e.target.value})}
                  placeholder="Enter university name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUniversity.email}
                  onChange={(e) => setNewUniversity({...newUniversity, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zone">Zone</Label>
              <Select value={newUniversity.zone} onValueChange={(value) => setNewUniversity({...newUniversity, zone: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                  <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sports</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Kho Kho', 'Badminton', 'Netball', 'Kabaddi', 'Football'].map((sport, index) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={sport}
                      checked={newUniversity.sports.includes(sport)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewUniversity({...newUniversity, sports: [...newUniversity.sports, sport]})
                        } else {
                          setNewUniversity({...newUniversity, sports: newUniversity.sports.filter(s => s !== sport)})
                        }
                      }}
                    />
                    <Label htmlFor={sport} className="text-sm">{sport}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUniversity(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUniversity} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Add University
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Player Modal */}
      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newPlayer.firstName}
                  onChange={(e) => setNewPlayer({...newPlayer, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newPlayer.lastName}
                  onChange={(e) => setNewPlayer({...newPlayer, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer({...newPlayer, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newPlayer.phone}
                  onChange={(e) => setNewPlayer({...newPlayer, phone: e.target.value})}
                  placeholder="Enter phone"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University</Label>
                <Select value={newPlayer.university} onValueChange={(value) => setNewPlayer({...newPlayer, university: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((uni, index) => (
                      <SelectItem key={uni.id || `uni-${index}`} value={uni.name}>{uni.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sport">Sport</Label>
                <Select value={newPlayer.sport} onValueChange={(value) => setNewPlayer({...newPlayer, sport: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kho Kho">Kho Kho</SelectItem>
                    <SelectItem value="Badminton">Badminton</SelectItem>
                    <SelectItem value="Netball">Netball</SelectItem>
                    <SelectItem value="Kabaddi">Kabaddi</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPlayer} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit University Modal */}
      <Dialog open={!!editingUniversity} onOpenChange={() => setEditingUniversity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">University Name</Label>
                <Input
                  id="edit-name"
                  value={editingUniversity?.name || ''}
                  onChange={(e) => setEditingUniversity({...editingUniversity, name: e.target.value})}
                  placeholder="Enter university name"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUniversity?.email || ''}
                  onChange={(e) => setEditingUniversity({...editingUniversity, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-zone">Zone</Label>
              <Select value={editingUniversity?.zone || ''} onValueChange={(value) => setEditingUniversity({...editingUniversity, zone: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                  <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUniversity(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUniversity} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Update University
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Player Modal */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editingPlayer?.firstName || ''}
                  onChange={(e) => setEditingPlayer({...editingPlayer, firstName: e.target.value})}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editingPlayer?.lastName || ''}
                  onChange={(e) => setEditingPlayer({...editingPlayer, lastName: e.target.value})}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingPlayer?.email || ''}
                  onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editingPlayer?.phone || ''}
                  onChange={(e) => setEditingPlayer({...editingPlayer, phone: e.target.value})}
                  placeholder="Enter phone"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlayer} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Update Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Edit/View Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMatch ? 'Edit Match' : 'View Match'}
            </DialogTitle>
          </DialogHeader>
          
          {editingMatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match-sport">Sport</Label>
                  <Input
                    id="match-sport"
                    value={editingMatch.sport || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, sport: e.target.value})}
                    placeholder="Enter sport"
                  />
                </div>
                <div>
                  <Label htmlFor="match-status">Status</Label>
                  <Select 
                    value={editingMatch.status || 'scheduled'} 
                    onValueChange={(value) => setEditingMatch({...editingMatch, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match-team1">Team 1</Label>
                  <Input
                    id="match-team1"
                    value={editingMatch.teamA || editingMatch.team1 || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, teamA: e.target.value, team1: e.target.value})}
                    placeholder="Enter team 1"
                  />
                </div>
                <div>
                  <Label htmlFor="match-team2">Team 2</Label>
                  <Input
                    id="match-team2"
                    value={editingMatch.teamB || editingMatch.team2 || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, teamB: e.target.value, team2: e.target.value})}
                    placeholder="Enter team 2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match-score">Score</Label>
                  <Input
                    id="match-score"
                    value={editingMatch.score || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, score: e.target.value})}
                    placeholder="e.g., 2-1"
                  />
                </div>
                <div>
                  <Label htmlFor="match-winner">Winner</Label>
                  <Input
                    id="match-winner"
                    value={editingMatch.winner || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, winner: e.target.value})}
                    placeholder="Enter winner"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="match-date">Date</Label>
                  <Input
                    id="match-date"
                    type="date"
                    value={editingMatch.date || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="match-time">Time</Label>
                  <Input
                    id="match-time"
                    type="time"
                    value={editingMatch.time || ''}
                    onChange={(e) => setEditingMatch({...editingMatch, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="match-notes">Notes</Label>
                <Textarea
                  id="match-notes"
                  value={editingMatch.notes || editingMatch.adminNotes || ''}
                  onChange={(e) => setEditingMatch({...editingMatch, notes: e.target.value, adminNotes: e.target.value})}
                  placeholder="Enter match notes"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMatchModal(false)
                setEditingMatch(null)
              }}
            >
              Cancel
            </Button>
            {editingMatch && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => handleDeleteMatch(editingMatch.id)}
                  disabled={saving}
                >
                  Delete
                </Button>
                <Button 
                  onClick={handleSaveMatch}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}