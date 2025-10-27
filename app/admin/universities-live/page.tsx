"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { 
  GraduationCap, 
  Users, 
  Trophy, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Search
} from 'lucide-react'

export default function AdminUniversitiesLive() {
  const router = useRouter()
  const [universities, setUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedZone, setSelectedZone] = useState('all')
  const [editingUniversity, setEditingUniversity] = useState<any>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const SPORTS_OPTIONS = [
    'Kho Kho',
    'Badminton',
    'Netball',
    'Kabaddi',
    'Football'
  ]

  const ZONES = [
    { value: 'all', label: 'All Zones' },
    { value: 'NZ+CZ', label: 'North & Central Zone' },
    { value: 'LZ+SZ', label: 'London & South Zone' }
  ]

  // Load universities from Firebase
  useEffect(() => {
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    try {
      setLoading(true)
      const universitiesRef = collection(db, 'universities')
      const q = query(universitiesRef, orderBy('name'))
      const snapshot = await getDocs(q)
      
      const universitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('📋 Loaded universities:', universitiesData.length)
      setUniversities(universitiesData)
      
    } catch (error) {
      console.error('❌ Error loading universities:', error)
      setMessage({type: 'error', text: 'Failed to load universities'})
    } finally {
      setLoading(false)
    }
  }

  const handleEditUniversity = (university: any) => {
    setEditingUniversity({...university})
  }

  const handleSaveUniversity = async () => {
    if (!editingUniversity) return

    try {
      const universityRef = doc(db, 'universities', editingUniversity.id)
      await updateDoc(universityRef, {
        name: editingUniversity.name,
        email: editingUniversity.email,
        contactPerson: editingUniversity.contactPerson,
        contactRole: editingUniversity.contactRole,
        zone: editingUniversity.zone,
        sports: editingUniversity.sports || [],
        isCompeting: editingUniversity.isCompeting || false,
        competingStatus: editingUniversity.competingStatus || 'inactive',
        lastUpdated: new Date()
      })

      // Update local state
      setUniversities(prev => 
        prev.map(uni => 
          uni.id === editingUniversity.id ? editingUniversity : uni
        )
      )

      setMessage({type: 'success', text: 'University updated successfully!'})
      setEditingUniversity(null)

    } catch (error) {
      console.error('❌ Error updating university:', error)
      setMessage({type: 'error', text: 'Failed to update university'})
    }
  }

  const handleDeleteUniversity = async (universityId: string) => {
    if (!confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'universities', universityId))
      
      setUniversities(prev => prev.filter(uni => uni.id !== universityId))
      setMessage({type: 'success', text: 'University deleted successfully!'})

    } catch (error) {
      console.error('❌ Error deleting university:', error)
      setMessage({type: 'error', text: 'Failed to delete university'})
    }
  }

  const toggleSport = (sport: string) => {
    if (!editingUniversity) return
    
    setEditingUniversity(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }))
  }

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         uni.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesZone = selectedZone === 'all' || uni.zone === selectedZone
    return matchesSearch && matchesZone
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading universities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Live University Management</h1>
              <p className="text-gray-600">Manage universities in real-time with live updates</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={loadUniversities} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => router.push('/admin')}>
                Back to Admin
              </Button>
            </div>
          </div>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Universities</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="zone">Filter by Zone</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map(zone => (
                      <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {filteredUniversities.length} of {universities.length} universities
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Universities List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUniversities.map((university) => (
            <Card key={university.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{university.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUniversity(university)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUniversity(university.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={university.isCompeting ? 'default' : 'secondary'}>
                    {university.isCompeting ? 'Competing' : 'Not Competing'}
                  </Badge>
                  <Badge variant="outline">{university.zone}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Contact:</strong> {university.contactPerson}</div>
                  <div><strong>Email:</strong> {university.email}</div>
                  <div><strong>Role:</strong> {university.contactRole}</div>
                  {university.sports && university.sports.length > 0 && (
                    <div>
                      <strong>Sports:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {university.sports.map((sport: string) => (
                          <Badge key={sport} variant="outline" className="text-xs">
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUniversities.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Universities Found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Modal */}
        {editingUniversity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit University</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingUniversity(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">University Name</Label>
                    <Input
                      id="name"
                      value={editingUniversity.name}
                      onChange={(e) => setEditingUniversity(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editingUniversity.email}
                      onChange={(e) => setEditingUniversity(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={editingUniversity.contactPerson}
                      onChange={(e) => setEditingUniversity(prev => ({...prev, contactPerson: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactRole">Contact Role</Label>
                    <Input
                      id="contactRole"
                      value={editingUniversity.contactRole}
                      onChange={(e) => setEditingUniversity(prev => ({...prev, contactRole: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zone">Zone</Label>
                    <Select 
                      value={editingUniversity.zone} 
                      onValueChange={(value) => setEditingUniversity(prev => ({...prev, zone: value}))}
                    >
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
                    <Label>Competing Status</Label>
                    <Select 
                      value={editingUniversity.isCompeting ? 'competing' : 'not-competing'} 
                      onValueChange={(value) => setEditingUniversity(prev => ({
                        ...prev, 
                        isCompeting: value === 'competing',
                        competingStatus: value === 'competing' ? 'active' : 'inactive'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="competing">Competing</SelectItem>
                        <SelectItem value="not-competing">Not Competing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Sports Selection</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {SPORTS_OPTIONS.map((sport) => (
                      <div 
                        key={sport}
                        className={`border rounded-lg p-2 cursor-pointer transition-colors ${
                          editingUniversity.sports.includes(sport) 
                            ? 'bg-orange-100 border-orange-300' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSport(sport)}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editingUniversity.sports.includes(sport)}
                            onChange={() => toggleSport(sport)}
                            className="rounded"
                          />
                          <span className="text-sm">{sport}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingUniversity(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUniversity}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
