'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Users, Plus, Search, Filter, Edit, Trash2, Mail, Phone, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';
import { ref, get, update, remove } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function UniversityPlayers() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.push('/login');
    }
  }, [firebaseUser, authLoading, router]);

  useEffect(() => {
    if (mounted && firebaseUser) {
      loadPlayers();
    }
  }, [mounted, firebaseUser]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      
      // Load real players data from Firebase
      const universitiesRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universitiesRef);
      
      if (snapshot.exists()) {
        const universitiesData = snapshot.val();
        
        // Find the current university
        const universityData = Object.values(universitiesData).find((uni: any) => 
          uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
        );
        
        if (universityData) {
          // Load players for this university
          const playersData = universityData.players || {};
          let playersList = [];
          if (Array.isArray(playersData)) {
            playersList = playersData;
          } else if (typeof playersData === 'object') {
            playersList = Object.values(playersData).flat();
          }
          
          // Format players data for display
          const formattedPlayers = playersList.map((player: any, index: number) => ({
            id: player.id || `player-${index}`,
            name: player.firstName && player.lastName ? `${player.firstName} ${player.lastName}` : player.name || `Player ${index + 1}`,
            email: player.email || 'No email',
            phone: player.phone || 'No phone',
            sport: player.sport || 'Not specified',
            position: player.position || 'Player',
            status: player.checkedIn ? 'active' : 'inactive',
            joinedDate: player.createdAt ? (typeof window !== 'undefined' ? new Date(player.createdAt).toISOString().split('T')[0] : 'Loading...') : 'Unknown'
          }));
          
          setPlayers(formattedPlayers);
        } else {
          setPlayers([]);
        }
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error loading players:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditPlayer = (player: any) => {
    console.log('Editing player:', player);
    setEditingPlayer(player);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm('Are you sure you want to delete this player?')) {
      try {
        setSaving(true);
        // Find the player in the current data structure
        const universityRef = ref(realtimeDb, 'universities');
        const snapshot = await get(universityRef);
        
        if (snapshot.exists()) {
          const universitiesData = snapshot.val();
          const universityData = Object.values(universitiesData).find((uni: any) => 
            uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
          );
          
          if (universityData) {
            // Update the players array by removing the player
            const updatedPlayers = (universityData.players || []).filter((p: any) => p.id !== playerId);
            
            // Update Firebase
            const uniRef = ref(realtimeDb, `universities/${universityData.id}`);
            await update(uniRef, { players: updatedPlayers });
            
            // Reload data
            await loadPlayers();
            alert('Player deleted successfully!');
          }
        }
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSavePlayer = async () => {
    try {
      setSaving(true);
      
      // Find the university data
      const universityRef = ref(realtimeDb, 'universities');
      const snapshot = await get(universityRef);
      
      if (snapshot.exists()) {
        const universitiesData = snapshot.val();
        const universityData = Object.values(universitiesData).find((uni: any) => 
          uni.email === firebaseUser?.email || uni.contactPerson === firebaseUser?.email
        );
        
        if (universityData) {
          // Update the players array
          const updatedPlayers = (universityData.players || []).map((p: any) => 
            p.id === editingPlayer.id ? { ...p, ...editingPlayer, updatedAt: new Date().toISOString() } : p
          );
          
          // Update Firebase
          const uniRef = ref(realtimeDb, `universities/${universityData.id}`);
          await update(uniRef, { players: updatedPlayers });
          
          // Reload data
          await loadPlayers();
          setEditingPlayer(null);
          alert('Player updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Error saving player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 p-6 ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Player Management</h1>
              <p className="text-gray-600">Manage your university's sports players</p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search players by name, email, or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
                <Card key={player.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{player.name}</CardTitle>
                      <Badge className={
                        player.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {player.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{player.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{player.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sport:</span>
                        <span className="font-medium">{player.sport}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Position:</span>
                        <span className="font-medium">{player.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Joined:</span>
                        <span className="font-medium">{player.joinedDate}</span>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditPlayer(player);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeletePlayer(player.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPlayers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first player.'}
                </p>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>
            )}


            {/* Professional Player Edit Modal */}
            {editingPlayer && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Edit Player Information</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPlayer(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="border-b pb-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <Input
                            value={editingPlayer.firstName || editingPlayer.name?.split(' ')[0] || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, firstName: e.target.value})}
                            placeholder="First name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <Input
                            value={editingPlayer.lastName || editingPlayer.name?.split(' ')[1] || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, lastName: e.target.value})}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <Input
                            value={editingPlayer.phone || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, phone: e.target.value})}
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <Input
                            type="email"
                            value={editingPlayer.email || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, email: e.target.value})}
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sport *</label>
                        <select
                          value={editingPlayer.sport || ''}
                          onChange={(e) => setEditingPlayer({...editingPlayer, sport: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select a sport</option>
                          <option value="Kho Kho">Kho Kho</option>
                          <option value="Badminton">Badminton</option>
                          <option value="Netball">Netball</option>
                          <option value="Kabaddi">Kabaddi</option>
                          <option value="Football">Football</option>
                        </select>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="border-b pb-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                          <Input
                            value={editingPlayer.emergencyContactName || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactName: e.target.value})}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relation *</label>
                          <Input
                            value={editingPlayer.emergencyContactRelation || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactRelation: e.target.value})}
                            placeholder="e.g., Parent, Spouse, Sibling"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                          <Input
                            value={editingPlayer.emergencyContactPhone || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactPhone: e.target.value})}
                            placeholder="Phone number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Email *</label>
                          <Input
                            type="email"
                            value={editingPlayer.emergencyContactEmail || ''}
                            onChange={(e) => setEditingPlayer({...editingPlayer, emergencyContactEmail: e.target.value})}
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h4>
                      
                      {/* Allergies */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Do you have any allergies?
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasAllergies"
                              value="yes"
                              checked={editingPlayer.hasAllergies === true}
                              onChange={(e) => setEditingPlayer({...editingPlayer, hasAllergies: e.target.value === 'yes'})}
                              className="text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasAllergies"
                              value="no"
                              checked={editingPlayer.hasAllergies === false}
                              onChange={(e) => setEditingPlayer({...editingPlayer, hasAllergies: e.target.value === 'yes', allergies: ''})}
                              className="text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                        {editingPlayer.hasAllergies && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Please specify your allergies
                            </label>
                            <Input
                              value={editingPlayer.allergies || ''}
                              onChange={(e) => setEditingPlayer({...editingPlayer, allergies: e.target.value})}
                              placeholder="e.g., Peanuts, Shellfish, Pollen"
                            />
                          </div>
                        )}
                      </div>

                      {/* Medical Conditions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medical Conditions (Optional)
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                          If you'd like to share any medical conditions that might be relevant during sports activities, please let us know. This information is completely optional and will be kept confidential.
                        </p>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasMedicalCondition"
                              value="yes"
                              checked={editingPlayer.hasMedicalCondition === true}
                              onChange={(e) => setEditingPlayer({...editingPlayer, hasMedicalCondition: e.target.value === 'yes'})}
                              className="text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">Yes, I'd like to share</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="hasMedicalCondition"
                              value="no"
                              checked={editingPlayer.hasMedicalCondition === false}
                              onChange={(e) => setEditingPlayer({...editingPlayer, hasMedicalCondition: e.target.value === 'yes', medicalCondition: ''})}
                              className="text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">No, I prefer not to share</span>
                          </label>
                        </div>
                        {editingPlayer.hasMedicalCondition && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Please share any relevant medical conditions
                            </label>
                            <Input
                              value={editingPlayer.medicalCondition || ''}
                              onChange={(e) => setEditingPlayer({...editingPlayer, medicalCondition: e.target.value})}
                              placeholder="e.g., Asthma, Diabetes, Heart condition (optional)"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-8 pt-6 border-t">
                    <Button 
                      onClick={() => setEditingPlayer(null)}
                      variant="outline"
                      className="flex-1"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSavePlayer}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
