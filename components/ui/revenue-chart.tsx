'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Trophy, Users, Calendar } from 'lucide-react';

export function RevenueChart() {
  // Mock data for university sports performance
  const performanceData = [
    { month: 'Jan', sports: 2, players: 8, tournaments: 1 },
    { month: 'Feb', sports: 3, players: 12, tournaments: 2 },
    { month: 'Mar', sports: 4, players: 16, tournaments: 3 },
    { month: 'Apr', sports: 5, players: 20, tournaments: 4 },
    { month: 'May', sports: 5, players: 22, tournaments: 5 },
    { month: 'Jun', sports: 5, players: 25, tournaments: 6 },
  ];

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-gray-900">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Sports Performance Overview
        </CardTitle>
        <p className="text-gray-600 text-sm">Track your university's sports participation and growth</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {performanceData.map((data, index) => (
              <div key={data.month} className="flex-1 flex flex-col items-center space-y-2">
                <div className="w-full flex flex-col space-y-1">
                  <div 
                    className="bg-gradient-to-t from-orange-500 to-red-500 rounded-t"
                    style={{ height: `${(data.sports / 5) * 100}px` }}
                  />
                  <div 
                    className="bg-gradient-to-t from-red-500 to-orange-500 rounded-t"
                    style={{ height: `${(data.players / 25) * 100}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Sports</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Players</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
