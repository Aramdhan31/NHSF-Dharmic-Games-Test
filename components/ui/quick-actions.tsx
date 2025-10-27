'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Trophy, 
  Users, 
  Calendar,
  FileText,
  Shield
} from 'lucide-react';

interface QuickActionsProps {
  onAddUser: () => void;
  onExport: () => void;
}

export function QuickActions({ onAddUser, onExport }: QuickActionsProps) {
  const actions = [
    {
      title: 'Add Player',
      description: 'Register new team member',
      icon: Plus,
      onClick: onAddUser,
      color: 'from-red-500 to-orange-500',
      hoverColor: 'from-red-600 to-orange-600'
    },
    {
      title: 'Export Data',
      description: 'Download player list',
      icon: Download,
      onClick: onExport,
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'from-green-600 to-emerald-600'
    },
    {
      title: 'Upload Roster',
      description: 'Bulk import players',
      icon: Upload,
      onClick: () => console.log('Upload roster'),
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Tournament Settings',
      description: 'Configure sports',
      icon: Settings,
      onClick: () => console.log('Tournament settings'),
      color: 'from-purple-500 to-violet-500',
      hoverColor: 'from-purple-600 to-violet-600'
    }
  ];

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          Quick Actions
        </CardTitle>
        <p className="text-gray-600 text-sm">Common tasks for managing your team</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                onClick={action.onClick}
                className={`w-full justify-start p-4 h-auto bg-gradient-to-r ${action.color} hover:${action.hoverColor} text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
