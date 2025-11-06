"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useFirebase } from "@/lib/firebase-context"
import { checkAdminStatus, logAdminAccess } from "@/lib/admin-auth"
import { ref, onValue, update, get, push, set, remove } from "firebase/database"
import { collection, getDocs, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore"
import { realtimeDb, db } from "@/lib/firebase"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/ui/admin-sidebar"
import { LiveScoreAdmin } from "@/components/live-score-admin"
import { DynamicUpdateStatus } from "@/components/dynamic-update-status"
import { NightModeScreensaver } from "@/components/night-mode-screensaver"
import { UniversityContactsManagement } from "@/components/university-contacts-management"
import { universities as staticUniversities } from "@/app/teams/page"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  WifiOff,
  Menu,
  DollarSign
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
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string, action?: string} | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingMatch, setEditingMatch] = useState<any>(null)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [adminCheck, setAdminCheck] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [firebaseAvailable, setFirebaseAvailable] = useState(true)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mountedRef = useRef(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [universityToRemove, setUniversityToRemove] = useState<any>(null)
  
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
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null)
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

  // Clear selected university when switching away from universities tab
  useEffect(() => {
    if (activeTab !== 'universities' && selectedUniversity) {
      setSelectedUniversity(null)
    }
  }, [activeTab, selectedUniversity])

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
        console.log('🏛️ Universities data changed in admin dashboard - ALL ADMINS WILL SEE THIS UPDATE')
        let universitiesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          zone: doc.data().zone || "Unknown",
          sports: doc.data().sports || [],
          teamInfo: doc.data().teamInfo || {},
          contactPerson: doc.data().contactPerson || '',
          contactEmail: doc.data().contactEmail || '',
          contactPhone: doc.data().contactPhone || '',
          contactRole: doc.data().contactRole || '',
          members: doc.data().members || 0,
          wins: doc.data().wins || 0,
          losses: doc.data().losses || 0,
          points: doc.data().points || 0,
          description: doc.data().description || `${doc.data().name} Hindu Society`,
          tournamentDate: doc.data().date === "2025-11-22" ? "Nov 22, 2025" : "Nov 23, 2025",
          isCompeting: doc.data().status === "competing" || doc.data().isCompeting === true,
          status: doc.data().status || "affiliated",
          approximateTotal: doc.data().approximateTotal
        }))
        
        // Add competing universities from static code (teams page) that might not be in Firebase yet
        const staticCompetingUnis = staticUniversities.filter(uni => uni.isCompeting === true);
        console.log('📊 Found competing universities in static code:', staticCompetingUnis.length);
        
        // Merge static universities with Firebase data (avoid duplicates by name)
        const existingNames = new Set(universitiesList.map(uni => (uni.name || '').toLowerCase()));
        
        staticCompetingUnis.forEach(staticUni => {
          const nameLower = staticUni.name.toLowerCase();
          if (!existingNames.has(nameLower)) {
            // Add static university to the list
            universitiesList.push({
              id: staticUni.id || `static-${staticUni.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: staticUni.name,
              zone: staticUni.zone,
              sports: staticUni.sports || [],
              teamInfo: staticUni.teamInfo || {},
              members: staticUni.members || 0,
              wins: staticUni.wins || 0,
              losses: staticUni.losses || 0,
              points: staticUni.points || 0,
              description: staticUni.description || `${staticUni.name} Hindu Society`,
              tournamentDate: staticUni.tournamentDate,
              isCompeting: true, // Always true for static competing universities
              status: 'competing',
              isStatic: true, // Flag to indicate this is from static code
              email: '', // May not have email in static data
              contactPerson: '',
              contactEmail: '',
              contactPhone: '',
              contactRole: '',
              approximateTotal: staticUni.approximateTotal
            });
            existingNames.add(nameLower);
          } else {
            // Update existing university with static data if it's missing isCompeting flag
            const existingIndex = universitiesList.findIndex(uni => 
              (uni.name || '').toLowerCase() === nameLower
            );
            if (existingIndex >= 0 && staticUni.isCompeting === true) {
              const existing = universitiesList[existingIndex];
              universitiesList[existingIndex] = {
                ...existing,
                isCompeting: true,
                status: existing.status || 'competing',
                // Merge sports and teamInfo from static if missing
                sports: existing.sports && existing.sports.length > 0 && existing.sports[0] !== 'TBD'
                  ? existing.sports
                  : (staticUni.sports || existing.sports || []),
                teamInfo: existing.teamInfo || staticUni.teamInfo || {},
                // Merge approximateTotal from static if available
                approximateTotal: existing.approximateTotal || staticUni.approximateTotal
              };
            }
          }
        });
        
        // Ensure each university has a unique id and sort alphabetically
        const universitiesWithIds = universitiesList.map((uni, index) => ({
          ...uni,
          id: uni.id || `uni-${index}-${Date.now()}`
        }))
        universitiesWithIds.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setUniversities(universitiesWithIds)
        
        // Update selected university if it exists
        if (selectedUniversity) {
          const updatedUni = universitiesWithIds.find(u => u.id === selectedUniversity.id || u.name === selectedUniversity.name)
          if (updatedUni) {
            setSelectedUniversity(updatedUni)
          }
        }
        
        console.log('📊 Universities updated in real-time (sorted alphabetically):', universitiesWithIds.length)
        console.log('📊 Competing universities:', universitiesWithIds.filter(u => u.isCompeting).length)
        console.log('📊 Sample competing universities:', universitiesWithIds.filter(u => u.isCompeting).slice(0, 3).map(u => u.name))
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
        console.log('👥 Players listener triggered - ALL ADMINS WILL SEE THIS UPDATE')
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const playersList = Object.values(data || {}) as any[]
          // Ensure each player has a unique id
          const playersWithIds = playersList.map((player, index) => ({
            ...player,
            id: player.id || `player-${index}-${Date.now()}`
          }))
          setPlayers(playersWithIds)
          console.log('👥 Players updated in real-time:', playersWithIds.length)
        } else {
          console.log('👥 No players data found in Realtime DB, trying Firestore...')
          // Try loading from Firestore or universities
          loadPlayersFromUniversities()
        }
      } catch (error) {
        console.error('❌ Error in players listener:', error)
        // Try fallback loading
        loadPlayersFromUniversities()
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

    const fetchAdmins = async () => {
      try {
        if (!adminCheck?.isSuperAdmin) return
        setLoadingAdmins(true)
        const res = await fetch('/api/admin-management')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (data.success && data.admins) {
          setAdmins(data.admins || [])
          console.log('✅ Loaded admins:', data.admins.length)
        }
      } catch (e) {
        console.warn('Failed to fetch admins:', e)
      } finally {
        setLoadingAdmins(false)
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
      // Sort universities alphabetically by name
      universitiesData.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setUniversities(universitiesData)
      console.log('✅ Universities loaded (sorted alphabetically):', universitiesData.length)
      
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

  const handleUpdatePaymentField = async (universityId: string, field: string, value: any) => {
    try {
      setSaving(true)
      const updateData: any = {
        [field]: value,
        updatedAt: new Date().toISOString()
      }
      
      // Update Firestore FIRST (since listeners are watching Firestore)
      try {
        const universityRef = doc(db, 'universities', universityId)
        await updateDoc(universityRef, updateData)
        console.log(`✅ Updated ${field} in Firestore - changes will appear immediately`)
      } catch (firestoreError: any) {
        // If document doesn't exist, create it
        if (firestoreError?.code === 'not-found' || firestoreError?.code === 5) {
          const universityRef = doc(db, 'universities', universityId)
          await setDoc(universityRef, {
            ...updateData,
            id: universityId,
            createdAt: new Date().toISOString()
          })
          console.log('✅ Created new Firestore document')
        } else {
          console.error('⚠️ Could not update Firestore:', firestoreError)
        }
      }
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`)
        await update(universityRealtimeRef, updateData)
        console.log('✅ Updated Realtime Database')
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError)
      }
      
      // Update local state immediately
      setUniversities(prev => prev.map(u => 
        u.id === universityId ? { ...u, ...updateData } : u
      ))
      
      // Update selected university if it's the same one
      if (selectedUniversity && selectedUniversity.id === universityId) {
        setSelectedUniversity({ ...selectedUniversity, ...updateData })
      }
      
      console.log(`✅ Updated ${field} for university ${universityId}`)
    } catch (error: any) {
      console.error(`❌ Error updating ${field}:`, error)
      setMessage({type: 'error', text: `Failed to update ${field}`})
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTeamPaymentField = async (universityId: string, sport: string, field: string, value: any) => {
    try {
      setSaving(true)
      
      // Get current university data
      const currentUni = universities.find(u => u.id === universityId) || selectedUniversity
      const currentTeamPayments = currentUni?.teamPayments || {}
      
      const updateData: any = {
        teamPayments: {
          ...currentTeamPayments,
          [sport]: {
            ...currentTeamPayments[sport],
            [field]: value,
            lastUpdated: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
      
      // Update Firestore FIRST (since listeners are watching Firestore)
      try {
        const universityRef = doc(db, 'universities', universityId)
        await updateDoc(universityRef, updateData)
        console.log(`✅ Updated ${field} for ${sport} team in Firestore - changes will appear immediately`)
      } catch (firestoreError: any) {
        // If document doesn't exist, create it
        if (firestoreError?.code === 'not-found' || firestoreError?.code === 5) {
          const universityRef = doc(db, 'universities', universityId)
          await setDoc(universityRef, {
            ...updateData,
            id: universityId,
            createdAt: new Date().toISOString()
          })
          console.log('✅ Created new Firestore document')
        } else {
          console.error('⚠️ Could not update Firestore:', firestoreError)
        }
      }
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${universityId}`)
        await update(universityRealtimeRef, updateData)
        console.log('✅ Updated Realtime Database')
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError)
      }
      
      // Update local state immediately
      setUniversities(prev => prev.map(u => 
        u.id === universityId ? { ...u, ...updateData } : u
      ))
      
      // Update selected university if it's the same one
      if (selectedUniversity && selectedUniversity.id === universityId) {
        setSelectedUniversity({ ...selectedUniversity, ...updateData })
      }
      
      console.log(`✅ Updated ${field} for ${sport} team at university ${universityId}`)
    } catch (error: any) {
      console.error(`❌ Error updating ${field} for team:`, error)
      setMessage({type: 'error', text: `Failed to update ${field} for team`})
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUniversity = async () => {
    if (!editingUniversity) return
    
    try {
      setSaving(true)
      
      // Prepare update data
      const updateData = {
        ...editingUniversity,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Update Firestore FIRST (since listeners are watching Firestore)
      try {
        const firestoreRef = doc(db, 'universities', editingUniversity.id)
        await updateDoc(firestoreRef, updateData)
        console.log('✅ Updated Firestore - changes will appear immediately')
      } catch (firestoreError: any) {
        // If document doesn't exist, create it
        if (firestoreError?.code === 'not-found' || firestoreError?.code === 5) {
          const firestoreRef = doc(db, 'universities', editingUniversity.id)
          await setDoc(firestoreRef, {
            ...updateData,
            createdAt: new Date().toISOString()
          })
          console.log('✅ Created new Firestore document')
        } else {
          console.error('⚠️ Could not update Firestore:', firestoreError)
        }
      }
      
      // Also update Realtime Database for consistency
      try {
        const universityRef = ref(realtimeDb, `universities/${editingUniversity.id}`)
        await update(universityRef, updateData)
        console.log('✅ Updated Realtime Database')
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError)
      }
      
      setMessage({type: 'success', text: 'University updated successfully! Changes will appear immediately.'})
      setEditingUniversity(null)
      // Universities will automatically update via real-time listener (onSnapshot)
    } catch (error) {
      console.error('Error updating university:', error)
      setMessage({type: 'error', text: 'Failed to update university'})
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUniversityStatus = async (university: any) => {
    // If removing from competing, show confirmation dialog
    if (university.isCompeting) {
      setUniversityToRemove(university)
      setShowRemoveConfirm(true)
      return
    }
    
    // If adding to competing, proceed directly
    await performToggleUniversityStatus(university)
  }

  const performToggleUniversityStatus = async (university: any) => {
    try {
      setSaving(true)
      const newStatus = university.isCompeting ? 'affiliated' : 'competing'
      
      const updateData = {
        isCompeting: !university.isCompeting,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // Update Firestore FIRST (listeners are watching Firestore)
      const universityRef = doc(db, "universities", university.id)
      await updateDoc(universityRef, updateData)
      console.log('✅ Updated Firestore - changes will appear immediately')
      
      // Also update Realtime Database for consistency
      try {
        const universityRealtimeRef = ref(realtimeDb, `universities/${university.id}`)
        await update(universityRealtimeRef, updateData)
        console.log('✅ Updated Realtime Database')
      } catch (realtimeError) {
        console.log('⚠️ Could not update Realtime Database:', realtimeError)
      }
      
      // Update the local state immediately for better UX
      setUniversities(prevUniversities => 
        prevUniversities.map(uni => 
          uni.id === university.id 
            ? { ...uni, isCompeting: !university.isCompeting, status: newStatus }
            : uni
        )
      )
      
      // Update selected university if it's the one being changed
      if (selectedUniversity && selectedUniversity.id === university.id) {
        setSelectedUniversity({ ...selectedUniversity, isCompeting: !university.isCompeting, status: newStatus })
      }
      
      setMessage({
        type: 'success', 
        text: `${university.name} is now ${newStatus === 'competing' ? 'competing' : 'affiliated'}. Changes will appear immediately.`
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
    totalUniversities: universities.filter(uni => uni.isCompeting === true || uni.status === 'competing').length, // Only competing universities
    totalPlayers: players.length,
    totalMatches: matches.length,
    pendingRequests: adminRequests.filter(req => req.status === 'pending').length,
    approvedRequests: adminRequests.filter(req => req.status === 'approved').length,
    liveMatches: matches.filter(match => match.status === 'live').length,
    completedMatches: matches.filter(match => match.status === 'completed').length,
    upcomingMatches: matches.filter(match => match.status === 'scheduled').length
  }

  const adminName = user?.displayName || user?.email?.split('@')[0] || 'Admin'


  // Show loading while checking auth and admin status
  if (loading || (user && !adminCheck)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Only redirect if we're sure user is not logged in (not loading and no user)
  if (!loading && !user) {
    router.push('/admin/login')
    return null
  }

  // Only show access denied if we're sure user is not admin (not loading, user exists, adminCheck done)
  if (!loading && user && adminCheck && !adminCheck.isAdmin) {
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

  // Don't render dashboard until admin check is complete
  if (!adminCheck?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className={`fixed left-0 top-0 z-50 h-screen transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <AdminSidebar />
        </div>
        
        {/* Main Content - Full width on mobile, with margin on desktop */}
        <div className="lg:ml-64">
          {/* Header */}
          <div className={`shadow-sm border-b px-4 sm:px-6 py-4 ${
            adminCheck?.isSuperAdmin 
              ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-yellow-300' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
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
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        {adminCheck?.isSuperAdmin ? 'Super Admin' : 'Admin'}
                        <span className="hidden sm:inline"> Dashboard</span>
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
                    <p className={`font-medium mt-1 text-xs sm:text-sm ${
                      adminCheck?.isSuperAdmin ? 'text-amber-700' : 'text-orange-600'
                    }`}>
                      Welcome back, <span className="hidden sm:inline">{adminName}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <div className="hidden sm:flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${firebaseAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {firebaseAvailable ? 'Firebase Online' : 'Firebase Offline'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${realtimeConnected ? 'bg-orange-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs sm:text-sm text-gray-600">
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
                  size="sm"
                  className="text-gray-600"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {message && (
              <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : message.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : message.type === 'warning' ? 'text-yellow-800' : 'text-green-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <TabsList className={`inline-flex w-full min-w-max ${adminCheck?.isSuperAdmin ? 'lg:grid lg:grid-cols-9' : 'lg:grid lg:grid-cols-7'} text-xs sm:text-sm`}>
                  <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
                  <TabsTrigger value="universities" className="whitespace-nowrap">Universities</TabsTrigger>
                  <TabsTrigger value="university-contacts" className="whitespace-nowrap">Contacts</TabsTrigger>
                  <TabsTrigger value="players" className="whitespace-nowrap">Players</TabsTrigger>
                  <TabsTrigger value="matches" className="whitespace-nowrap">Matches</TabsTrigger>
                  <TabsTrigger value="scoring" className="whitespace-nowrap">Scoring</TabsTrigger>
                  <TabsTrigger value="live-scores" className="whitespace-nowrap">Live Scores</TabsTrigger>
                  {adminCheck?.isSuperAdmin && <TabsTrigger value="admin-requests" className="whitespace-nowrap">Requests</TabsTrigger>}
                  {adminCheck?.isSuperAdmin && <TabsTrigger value="settings" className="whitespace-nowrap">Settings</TabsTrigger>}
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
                      <Building2 className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUniversities}</div>
                      <p className="text-xs text-orange-100">Competing universities</p>
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

              </TabsContent>

              {/* Universities Tab */}
              <TabsContent value="universities" className="space-y-4 sm:space-y-6">
                {selectedUniversity ? (
                  // Detailed University View
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedUniversity(null)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Back to List
                        </Button>
                        <h2 className="text-xl sm:text-2xl font-bold">{selectedUniversity.name}</h2>
                        <Badge variant="outline">{selectedUniversity.zone}</Badge>
                        {selectedUniversity.isCompeting && (
                          <Badge className="bg-green-500">Competing</Badge>
                        )}
                      </div>
                      <Button onClick={() => setEditingUniversity(selectedUniversity)} size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit University
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Contact Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Contact Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {(() => {
                            const contactsList = selectedUniversity.contacts && Array.isArray(selectedUniversity.contacts) && selectedUniversity.contacts.length > 0 
                              ? selectedUniversity.contacts 
                              : (selectedUniversity.contactPerson || selectedUniversity.contactEmail || selectedUniversity.contactPhone 
                                ? [{ 
                                    contactPerson: selectedUniversity.contactPerson, 
                                    contactEmail: selectedUniversity.contactEmail, 
                                    contactPhone: selectedUniversity.contactPhone, 
                                    contactRole: selectedUniversity.contactRole 
                                  }] 
                                : []);
                            
                            if (contactsList.length === 0) {
                              return (
                                <div className="text-sm text-gray-500">
                                  No contact details available
                                </div>
                              );
                            }
                            
                            return contactsList.map((contact: any, index: number) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                {contactsList.length > 1 && (
                                  <div className="text-xs font-medium text-gray-700 mb-2">
                                    Contact {index + 1} of {contactsList.length}
                                  </div>
                                )}
                                {contact.contactPerson && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{contact.contactPerson}</span>
                                    {contact.contactRole && (
                                      <span className="text-gray-500">({contact.contactRole})</span>
                                    )}
                                  </div>
                                )}
                                {contact.contactEmail && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <a href={`mailto:${contact.contactEmail}`} className="text-blue-600 hover:underline">
                                      {contact.contactEmail}
                                    </a>
                                  </div>
                                )}
                                {contact.contactPhone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <a href={`tel:${contact.contactPhone}`} className="text-blue-600 hover:underline">
                                      {contact.contactPhone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </CardContent>
                      </Card>

                      {/* Sports & Teams */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5" />
                            Sports & Teams
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedUniversity.sports && selectedUniversity.sports.length > 0 ? (
                            <div className="space-y-3">
                              {selectedUniversity.sports.map((sport: string, idx: number) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="font-medium text-sm mb-2">{sport}</div>
                                  {selectedUniversity.teamInfo && selectedUniversity.teamInfo[sport] && (
                                    <div className="text-xs text-gray-600 space-y-1">
                                      {selectedUniversity.teamInfo[sport].teamA && (
                                        <div>Team A: {selectedUniversity.teamInfo[sport].teamA.isOpen ? 'Open' : 'Closed'}</div>
                                      )}
                                      {selectedUniversity.teamInfo[sport].teamB && (
                                        <div>Team B: {selectedUniversity.teamInfo[sport].teamB.isOpen ? 'Open' : 'Closed'}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No sports registered</div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Payment & Confirmation (Per Team) */}
                      {selectedUniversity.sports && selectedUniversity.sports.length > 0 && (
                        <Card className="lg:col-span-2">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5" />
                              Payment & Confirmation (Per Team)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {/* Approximate Total */}
                            {selectedUniversity.approximateTotal && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Approximate Total:</span>
                                  </div>
                                  <span className="text-lg font-bold text-blue-700">£{selectedUniversity.approximateTotal}</span>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedUniversity.sports.map((sport: string) => {
                                const teamPayment = selectedUniversity.teamPayments?.[sport] || {};
                                return (
                                  <div key={sport} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="font-medium text-sm mb-3">{sport}</div>
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm">Confirmed?</Label>
                                        <Checkbox
                                          checked={teamPayment.confirmed || false}
                                          onCheckedChange={(checked) => {
                                            handleUpdateTeamPaymentField(selectedUniversity.id, sport, 'confirmed', checked === true);
                                          }}
                                          disabled={saving}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm">Payment Link Sent?</Label>
                                        <Checkbox
                                          checked={teamPayment.paymentLinkSent || false}
                                          onCheckedChange={(checked) => {
                                            handleUpdateTeamPaymentField(selectedUniversity.id, sport, 'paymentLinkSent', checked === true);
                                          }}
                                          disabled={saving}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm">Paid?</Label>
                                        <Checkbox
                                          checked={teamPayment.paid || false}
                                          onCheckedChange={(checked) => {
                                            handleUpdateTeamPaymentField(selectedUniversity.id, sport, 'paid', checked === true);
                                          }}
                                          disabled={saving}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Players */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Players ({players.filter((p: any) => p.university === selectedUniversity.name).length})
                            </CardTitle>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setNewPlayer({ ...newPlayer, university: selectedUniversity.name });
                                setShowAddPlayer(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Player
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {players.filter((p: any) => p.university === selectedUniversity.name).length > 0 ? (
                            <div className="space-y-2">
                              {players
                                .filter((p: any) => p.university === selectedUniversity.name)
                                .map((player: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-sm">{player.firstName} {player.lastName}</div>
                                      <div className="text-xs text-gray-600">{player.sport} • {player.email}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingPlayer(player)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No players registered for this university</div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  // University List View
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                      <h2 className="text-xl sm:text-2xl font-bold">Universities</h2>
                      <Button onClick={() => setShowAddUniversity(true)} size="sm" className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add University</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search universities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:max-w-sm"
                    />
                  </div>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Zones</SelectItem>
                      <SelectItem value="NZ+CZ">North & Central Zone</SelectItem>
                      <SelectItem value="LZ+SZ">London & South Zone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Show competing universities first, then others */}
                <div className="space-y-8">
                  {/* LZ+SZ Competing Universities Section */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center space-x-2 flex-wrap">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      <span className="bg-gradient-to-r from-blue-500 to-yellow-500 bg-clip-text text-transparent">London & South Zone (LZ+SZ)</span>
                      <Badge className="ml-2 text-xs bg-gradient-to-r from-blue-500 to-yellow-500">
                        {universities.filter(uni => {
                          const matchesSearch = searchTerm === '' || uni.name.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesZone = selectedZone === 'ALL' || selectedZone === 'LZ+SZ' || uni.zone === 'LZ+SZ' || uni.region === 'LZ+SZ'
                          const isCompeting = uni.isCompeting === true || uni.status === 'competing'
                          return matchesSearch && matchesZone && isCompeting && (uni.zone === 'LZ+SZ' || uni.region === 'LZ+SZ')
                        }).length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {universities
                        .filter(uni => {
                          const matchesSearch = searchTerm === '' || uni.name.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesZone = selectedZone === 'ALL' || selectedZone === 'LZ+SZ' || uni.zone === 'LZ+SZ' || uni.region === 'LZ+SZ'
                          const isCompeting = uni.isCompeting === true || uni.status === 'competing'
                          return matchesSearch && matchesZone && isCompeting && (uni.zone === 'LZ+SZ' || uni.region === 'LZ+SZ')
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                    .map((uni, index) => (
                    <Card 
                      key={uni.id || `uni-${index}`} 
                      className="hover:shadow-md transition-all border border-gray-200 cursor-pointer"
                      onClick={() => setSelectedUniversity(uni)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg font-semibold text-gray-900">{uni.name}</CardTitle>
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs font-medium">{uni.zone}</Badge>
                            <Badge variant={uni.isCompeting ? "default" : "secondary"} className="text-xs font-medium">
                              {uni.isCompeting ? "Competing" : "Not Competing"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {uni.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{uni.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{uni.zone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <Gamepad2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{uni.sports?.join(', ') || 'No sports'}</span>
                        </div>
                        {/* Payment/Confirmation Fields */}
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          {uni.approximateTotal && (
                            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-700 font-medium">Approx. Total:</span>
                                <span className="text-blue-900 font-bold">£{uni.approximateTotal}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Confirmed?</span>
                            <Checkbox
                              checked={uni.confirmed || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'confirmed', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Payment Link Sent?</span>
                            <Checkbox
                              checked={uni.paymentLinkSent || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'paymentLinkSent', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Paid?</span>
                            <Checkbox
                              checked={uni.paid || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'paid', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUniversity(uni);
                            }}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant={uni.isCompeting ? "destructive" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUniversityStatus(uni);
                            }}
                            disabled={saving}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            {uni.isCompeting ? (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Remove
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                  </div>

                  {/* NZ+CZ Competing Universities Section */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center space-x-2 flex-wrap">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">North & Central Zone (NZ+CZ)</span>
                      <Badge className="ml-2 text-xs bg-gradient-to-r from-red-500 to-green-500">
                        {universities.filter(uni => {
                          const matchesSearch = searchTerm === '' || uni.name.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesZone = selectedZone === 'ALL' || selectedZone === 'NZ+CZ' || uni.zone === 'NZ+CZ' || uni.region === 'NZ+CZ'
                          const isCompeting = uni.isCompeting === true || uni.status === 'competing'
                          return matchesSearch && matchesZone && isCompeting && (uni.zone === 'NZ+CZ' || uni.region === 'NZ+CZ')
                        }).length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {universities
                        .filter(uni => {
                          const matchesSearch = searchTerm === '' || uni.name.toLowerCase().includes(searchTerm.toLowerCase())
                          const matchesZone = selectedZone === 'ALL' || selectedZone === 'NZ+CZ' || uni.zone === 'NZ+CZ' || uni.region === 'NZ+CZ'
                          const isCompeting = uni.isCompeting === true || uni.status === 'competing'
                          return matchesSearch && matchesZone && isCompeting && (uni.zone === 'NZ+CZ' || uni.region === 'NZ+CZ')
                        })
                        .sort((a, b) => a.name.localeCompare(b.name))
                    .map((uni, index) => (
                    <Card 
                      key={uni.id || `uni-${index}`} 
                      className="hover:shadow-md transition-all border border-gray-200 cursor-pointer"
                      onClick={() => setSelectedUniversity(uni)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg font-semibold text-gray-900">{uni.name}</CardTitle>
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs font-medium">{uni.zone}</Badge>
                            <Badge variant={uni.isCompeting ? "default" : "secondary"} className="text-xs font-medium">
                              {uni.isCompeting ? "Competing" : "Not Competing"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {uni.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{uni.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span>{uni.zone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                          <Gamepad2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{uni.sports?.join(', ') || 'No sports'}</span>
                        </div>
                        {/* Payment/Confirmation Fields */}
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Confirmed?</span>
                            <Checkbox
                              checked={uni.confirmed || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'confirmed', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Payment Link Sent?</span>
                            <Checkbox
                              checked={uni.paymentLinkSent || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'paymentLinkSent', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Paid?</span>
                            <Checkbox
                              checked={uni.paid || false}
                              onCheckedChange={(checked) => handleUpdatePaymentField(uni.id, 'paid', checked)}
                              disabled={saving}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUniversity(uni);
                            }}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant={uni.isCompeting ? "destructive" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUniversityStatus(uni);
                            }}
                            disabled={saving}
                            className="flex-1 sm:flex-none text-xs"
                          >
                            {uni.isCompeting ? (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Remove
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                  </div>

                </div>
                  </>
                )}
              </TabsContent>

              {/* University Contacts Tab */}
              <TabsContent value="university-contacts" className="space-y-6">
                <UniversityContactsManagement 
                  currentUser={adminCheck} 
                  onUniversityClick={(university) => {
                    setSelectedUniversity(university);
                    setActiveTab("universities");
                  }}
                />
              </TabsContent>

              {/* Players Tab */}
              <TabsContent value="players" className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold">Players ({players.length})</h2>
                  <Button onClick={() => setShowAddPlayer(true)} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add Player</span>
                    <span className="sm:hidden">Add</span>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                                  setMessage({ type: 'success', text: 'Admin updated successfully! Changes will appear immediately.' })
                                  setEditingAdmin(null)
                                  setEditAdminForm({})
                                  // Refresh admins immediately
                                  await fetchAdmins()
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
                                              setMessage({ type: 'success', text: 'Admin deleted successfully! Changes will appear immediately.' })
                                              // Refresh admins immediately
                                              await fetchAdmins()
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
                                  setMessage({ type: 'success', text: 'Admin created successfully! Changes will appear immediately.' })
                                  setShowAddAdmin(false)
                                  setNewAdmin({ email: '', password: '', name: '', role: 'admin', zones: [] })
                                  // Refresh admins immediately
                                  await fetchAdmins()
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
                    {[...universities].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map((uni, index) => (
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
            <div>
              <Label>Sports</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['Badminton', 'Football', 'Netball', 'Kabaddi (men\'s)', 'Kho Kho'].map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sport-${sport}`}
                      checked={editingUniversity?.sports?.includes(sport) || false}
                      onCheckedChange={(checked) => {
                        const currentSports = editingUniversity?.sports || []
                        const newSports = checked
                          ? [...currentSports, sport]
                          : currentSports.filter((s: string) => s !== sport)
                        setEditingUniversity({...editingUniversity, sports: newSports})
                      }}
                    />
                    <Label htmlFor={`sport-${sport}`} className="text-sm font-normal cursor-pointer">
                      {sport}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={editingUniversity?.isCompeting ? 'competing' : 'affiliated'} 
                onValueChange={(value) => setEditingUniversity({...editingUniversity, isCompeting: value === 'competing', status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="competing">Competing</SelectItem>
                  <SelectItem value="affiliated">Affiliated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Payment/Confirmation Fields */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700">Payment & Confirmation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-confirmed"
                    checked={editingUniversity?.confirmed || false}
                    onCheckedChange={(checked) => setEditingUniversity({...editingUniversity, confirmed: checked})}
                  />
                  <Label htmlFor="edit-confirmed" className="cursor-pointer">Confirmed?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-total">Total</Label>
                  <Input
                    id="edit-total"
                    type="number"
                    value={editingUniversity?.total || ''}
                    onChange={(e) => setEditingUniversity({...editingUniversity, total: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-paymentLinkSent"
                    checked={editingUniversity?.paymentLinkSent || false}
                    onCheckedChange={(checked) => setEditingUniversity({...editingUniversity, paymentLinkSent: checked})}
                  />
                  <Label htmlFor="edit-paymentLinkSent" className="cursor-pointer">Payment Link Sent?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-paid"
                    checked={editingUniversity?.paid || false}
                    onCheckedChange={(checked) => setEditingUniversity({...editingUniversity, paid: checked})}
                  />
                  <Label htmlFor="edit-paid" className="cursor-pointer">Paid?</Label>
                </div>
              </div>
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
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
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

      {/* Remove University Confirmation Dialog */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove University from Competing?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{universityToRemove?.name}</strong> from competing status? 
              This will change their status to "affiliated" and they will no longer appear in the league table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRemoveConfirm(false)
              setUniversityToRemove(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (universityToRemove) {
                  await performToggleUniversityStatus(universityToRemove)
                  setShowRemoveConfirm(false)
                  setUniversityToRemove(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}