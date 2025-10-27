'use client';

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardCardProps {
  stat: {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: LucideIcon;
    color: string;
    bgColor: string;
  };
  index: number;
}

export function DashboardCard({ stat, index }: DashboardCardProps) {
  const Icon = stat.icon;
  
  return (
    <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <div className="flex items-center">
              <span className={`text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
            <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${stat.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
