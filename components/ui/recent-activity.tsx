'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  UserPlus, 
  Trophy, 
  CheckCircle, 
  Clock,
  Users,
  Calendar,
  Shield
} from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'player_added',
      title: 'New Player Added',
      description: 'Alex Johnson joined the Football team',
      time: '2 hours ago',
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 2,
      type: 'sport_selected',
      title: 'Sport Selected',
      description: 'Badminton added to competition list',
      time: '4 hours ago',
      icon: Trophy,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 3,
      type: 'verification',
      title: 'Player Verified',
      description: 'Sarah Williams verification completed',
      time: '1 day ago',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 4,
      type: 'registration',
      title: 'Registration Updated',
      description: 'Emergency contact details updated',
      time: '2 days ago',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 5,
      type: 'tournament',
      title: 'Tournament Reminder',
      description: 'NHSF Dharmic Games starts in 2 weeks',
      time: '3 days ago',
      icon: Calendar,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'player_added':
        return UserPlus;
      case 'sport_selected':
        return Trophy;
      case 'verification':
        return CheckCircle;
      case 'registration':
        return Shield;
      case 'tournament':
        return Calendar;
      default:
        return Activity;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
            <Activity className="h-4 w-4 text-white" />
          </div>
          Recent Activity
        </CardTitle>
        <p className="text-gray-600 text-sm">Latest updates and changes</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activity.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
