'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  RefreshCw, 
  Download, 
  Bell,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({ 
  searchQuery, 
  onSearchChange, 
  onRefresh, 
  onExport, 
  isRefreshing 
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4 sm:p-6">
        {/* Left side - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search players, sports..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Center - Title */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">University Dashboard</h1>
            <p className="text-sm text-gray-600">NHSF Dharmic Games Management</p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="hidden sm:flex items-center space-x-2 bg-gray-50 border-gray-200 hover:bg-gray-100"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">Refresh</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="hidden sm:flex items-center space-x-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log('Logout')}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
