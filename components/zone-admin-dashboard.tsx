"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/lib/firebase-context";
import Link from "next/link";
import { 
  Users, 
  Trophy, 
  Shield,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit,
  Clock,
  CheckCircle,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { realtimeDbUtils } from "@/lib/firebase-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Zone types and access control
type Zone = 'LZ' | 'SZ' | 'CZ' | 'NZ';
type CombinedZone = 'LZ+SZ' | 'NZ+CZ';

interface ZoneConfig {
  name: string;
  fullName: string;
  color: string;
  bgColor: string;
  textColor: string;
  adminName: string;
  adminAvatar: string;
  isCombined?: boolean;
  componentZones?: Zone[];
}

const zoneConfigs: Record<Zone | CombinedZone, ZoneConfig> = {
  LZ: {
    name: 'LZ',
    fullName: 'London Zone',
    color: 'blue',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    adminName: '',
    adminAvatar: ''
  },
  SZ: {
    name: 'SZ',
    fullName: 'South Zone',
    color: 'green',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    adminName: '',
    adminAvatar: ''
  },
  CZ: {
    name: 'CZ',
    fullName: 'Central Zone',
    color: 'purple',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    adminName: '',
    adminAvatar: ''
  },
  NZ: {
    name: 'NZ',
    fullName: 'North Zone',
    color: 'red',
    bgColor: 'bg-red-500',
    textColor: 'text-red-600',
    adminName: '',
    adminAvatar: ''
  },
  'LZ+SZ': {
    name: 'LZ+SZ',
    fullName: 'London & South Zone',
    color: 'blue-green',
    bgColor: 'bg-gradient-to-r from-blue-500 to-green-500',
    textColor: 'text-blue-600',
    adminName: '',
    adminAvatar: '',
    isCombined: true,
    componentZones: ['LZ', 'SZ']
  },
  'NZ+CZ': {
    name: 'NZ+CZ',
    fullName: 'North & Central Zone',
    color: 'red-purple',
    bgColor: 'bg-gradient-to-r from-red-500 to-purple-500',
    textColor: 'text-red-600',
    adminName: '',
    adminAvatar: '',
    isCombined: true,
    componentZones: ['NZ', 'CZ']
  }
};

interface ZoneAdminDashboardProps {
  currentZone: Zone | CombinedZone;
  userZone?: Zone; // For access control
  currentUser?: any;
}

export function ZoneAdminDashboard({ currentZone, userZone, currentUser }: ZoneAdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUniversities: 0,
    totalPlayers: 0,
    activeMatches: 0,
    totalPoints: 0,
    winRate: 0
  });

  // Get zone configuration first
  const zoneConfig = zoneConfigs[currentZone];

  // Access control - only allow access to own zone or combined zones
  const hasAccess = !userZone || userZone === currentZone || 
    (zoneConfig.isCombined && zoneConfig.componentZones?.includes(userZone));

  // Load real stats from Firebase
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (zoneConfig.isCombined && zoneConfig.componentZones) {
          // For combined zones, aggregate stats from component zones
          const combinedStats = {
            totalUniversities: 0,
            totalPlayers: 0,
            activeMatches: 0,
            totalPoints: 0,
            winRate: 0
          };
          
          for (const componentZone of zoneConfig.componentZones) {
            const statsResult = await realtimeDbUtils.getData(`zones/${componentZone}/stats`);
            if (statsResult.success && statsResult.data) {
              combinedStats.totalUniversities += statsResult.data.totalUniversities || 0;
              combinedStats.totalPlayers += statsResult.data.totalPlayers || 0;
              combinedStats.activeMatches += statsResult.data.activeMatches || 0;
              combinedStats.totalPoints += statsResult.data.totalPoints || 0;
            }
          }
          
          // Calculate average win rate
          const winRates = [];
          for (const componentZone of zoneConfig.componentZones) {
            const statsResult = await realtimeDbUtils.getData(`zones/${componentZone}/stats`);
            if (statsResult.success && statsResult.data && statsResult.data.winRate) {
              winRates.push(statsResult.data.winRate);
            }
          }
          combinedStats.winRate = winRates.length > 0 ? 
            winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length : 0;
          
          setStats(combinedStats);
        } else {
          // For individual zones, load stats normally
          const statsResult = await realtimeDbUtils.getData(`zones/${currentZone}/stats`);
        if (statsResult.success && statsResult.data) {
            setStats(statsResult.data);
          }
        }
      } catch (error) {
        console.error('Error loading zone stats:', error);
      }
    };
    
    loadStats();
  }, [currentZone, zoneConfig]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              You don't have permission to access {zoneConfig.fullName} admin panel.
            </p>
            <Button asChild>
              <Link href="/admin">Back to Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ZoneDashboardContent zone={zoneConfig} stats={stats} />
  );
}

const ZoneDashboardContent = ({ zone, stats }: { zone: ZoneConfig; stats: any }) => {
  return (
    <div className="p-4 sm:p-6 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-4 sm:gap-6 flex-1 w-full h-full overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {zone.fullName} Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your zone's players, matches, and performance
          </p>
        </div>
        <Badge variant="outline" className={cn("px-3 py-1", zone.textColor)}>
          <Shield className="h-4 w-4 mr-2" />
          Zone Admin
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Zones</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              Competition zones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universities</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUniversities}</div>
            <p className="text-xs text-muted-foreground">
              In {zone.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Active in {zone.name}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeMatches}</div>
            <p className="text-xs text-muted-foreground">
              Currently playing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              This season
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => {
            // This will be handled by the parent component to switch to university-management tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'university-management' }));
          }}
          className="w-full"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Universities</h3>
                  <p className="text-sm text-gray-500">Add/edit universities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => {
            // This will be handled by the parent component to switch to match-management tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'match-management' }));
          }}
          className="w-full"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Match</h3>
                  <p className="text-sm text-gray-500">Add new match</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => {
            // This will be handled by the parent component to switch to match-management tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'match-management' }));
          }}
          className="w-full"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Edit className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Update Results</h3>
                  <p className="text-sm text-gray-500">Edit match scores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => {
            // This will be handled by the parent component to switch to realtime-results tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'realtime-results' }));
          }}
          className="w-full"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Live Matches</h3>
                  <p className="text-sm text-gray-500">Monitor active games</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => {
            // This will be handled by the parent component to switch to match-management tab
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'match-management' }));
          }}
          className="w-full"
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Results</h3>
                  <p className="text-sm text-gray-500">Fast score entry</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">No matches data available</p>
              <p className="text-sm text-gray-400 mt-2">Data will be loaded from Firebase</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">No player data available</p>
              <p className="text-sm text-gray-400 mt-2">Data will be loaded from Firebase</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};