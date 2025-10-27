'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trophy,
  Users,
  Calendar
} from 'lucide-react';

export function SystemStatus() {
  const statusItems = [
    {
      title: 'Registration Status',
      status: 'Open',
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      description: 'Player registration is currently open'
    },
    {
      title: 'Tournament Date',
      status: 'Nov 22-23, 2024',
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Calendar,
      description: 'NHSF Dharmic Games tournament dates'
    },
    {
      title: 'Team Verification',
      status: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Clock,
      description: 'Awaiting admin verification'
    },
    {
      title: 'Sports Selected',
      status: '5 Sports',
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: Trophy,
      description: 'Kho Kho, Badminton, Netball, Kabaddi, Football'
    }
  ];

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
            <Shield className="h-4 w-4 text-white" />
          </div>
          System Status
        </CardTitle>
        <p className="text-gray-600 text-sm">Current status of your university's participation</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.description}</p>
                  </div>
                </div>
                <Badge className={item.color}>
                  {item.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
