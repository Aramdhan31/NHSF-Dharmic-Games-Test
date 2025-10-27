'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Calendar, Trophy, Users, Clock, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/ui/admin-sidebar';
import { useFirebase } from '@/lib/firebase-context';
import { ref, get } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export default function UniversityTournaments() {
  const router = useRouter();
  const { firebaseUser, loading: authLoading } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      loadTournaments();
    }
  }, [mounted, firebaseUser]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      
      // Load tournaments from Firebase
      const tournamentsRef = ref(realtimeDb, 'tournaments');
      const snapshot = await get(tournamentsRef);
      
      if (snapshot.exists()) {
        const tournamentsData = snapshot.val();
        const tournamentsList = Object.values(tournamentsData || {});
        setTournaments(tournamentsList);
      } else {
        // If no tournaments exist, show empty state
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
      // Fallback to empty array on error
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournaments</h1>
              <p className="text-gray-600">View and manage upcoming tournaments</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
                      <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tournaments.filter(t => t.status === 'upcoming').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ongoing</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tournaments.filter(t => t.status === 'ongoing').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Teams</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {tournaments.reduce((sum, t) => sum + t.teams, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tournaments List */}
            {tournaments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5 text-orange-500" />
                        <span>{tournament.name}</span>
                      </CardTitle>
                      <Badge className={getStatusColor(tournament.status)}>
                        {tournament.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {tournament.startDate} - {tournament.endDate}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{tournament.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{tournament.teams} teams</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Prize:</span>
                        <span className="text-lg font-bold text-orange-600">{tournament.prize}</span>
                      </div>
                      <Button className="w-full mt-4">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tournaments Available</h3>
                <p className="text-gray-600 mb-4">
                  There are currently no tournaments scheduled. Check back later for updates.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Tournaments are created by NHSF(UK) administrators. Contact your zone administrator for more information.
                  </p>
                </div>
              </div>
            )}

            {/* Information for Universities */}
            {tournaments.length === 0 && (
              <div className="mt-8 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Tournament Information</h3>
                  <p className="text-blue-700 mb-4">
                    Tournaments are created and managed by NHSF(UK) administrators. 
                    You can view upcoming tournaments and register your teams here.
                  </p>
                  <p className="text-sm text-blue-600">
                    Contact your zone administrator for tournament registration details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
