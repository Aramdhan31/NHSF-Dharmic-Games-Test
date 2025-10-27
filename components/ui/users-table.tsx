'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Trophy, Shield, CheckCircle } from 'lucide-react';

interface UsersTableProps {
  onAddUser: () => void;
}

export function UsersTable({ onAddUser }: UsersTableProps) {
  // Mock data for university players
  const players = [
    { id: 1, name: 'Alex Johnson', sport: 'Football', status: 'Active', email: 'alex@university.ac.uk' },
    { id: 2, name: 'Sarah Williams', sport: 'Badminton', status: 'Active', email: 'sarah@university.ac.uk' },
    { id: 3, name: 'Mike Chen', sport: 'Kho Kho', status: 'Pending', email: 'mike@university.ac.uk' },
    { id: 4, name: 'Emma Davis', sport: 'Netball', status: 'Active', email: 'emma@university.ac.uk' },
    { id: 5, name: 'James Wilson', sport: 'Kabaddi', status: 'Active', email: 'james@university.ac.uk' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Inactive':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-gray-900">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-white" />
            </div>
            Player Management
          </CardTitle>
          <Button 
            onClick={onAddUser}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
        <p className="text-gray-600 text-sm">Manage your university's sports team players</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{player.name}</h3>
                    <Badge className={getStatusColor(player.status)}>
                      {player.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{player.email}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-gray-500">{player.sport}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-500">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {players.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Players Yet</h3>
            <p className="text-gray-600 mb-4">Start building your team by adding players</p>
            <Button 
              onClick={onAddUser}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Player
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
