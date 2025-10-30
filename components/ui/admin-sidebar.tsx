'use client';

import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  GraduationCap, 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  BarChart3,
  Shield,
  LogOut,
  Home,
  PlayCircle,
  UserCheck,
  Crown
} from 'lucide-react';
import { useFirebase } from '@/lib/firebase-context';
import { checkAdminStatus } from '@/lib/admin-auth';

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const mountedRef = useRef(false);
  const { user, signOut } = useFirebase();

  const adminCheck = useMemo(() => checkAdminStatus(user as any), [user]);
  const isSuperAdmin = adminCheck?.isSuperAdmin === true;

  useEffect(() => {
    mountedRef.current = true;
  }, []);
  
  const allMenuItems = [
    {
      title: 'Overview',
      icon: Home,
      href: '/admin',
      tab: 'overview'
    },
    {
      title: 'Universities',
      icon: GraduationCap,
      href: '/admin',
      tab: 'universities'
    },
    {
      title: 'Players',
      icon: Users,
      href: '/admin',
      tab: 'players'
    },
    {
      title: 'Matches',
      icon: Trophy,
      href: '/admin',
      tab: 'matches'
    },
    {
      title: 'Scoring',
      icon: PlayCircle,
      href: '/admin',
      tab: 'scoring'
    },
    {
      title: 'Admin Requests',
      icon: UserCheck,
      href: '/admin',
      tab: 'admin-requests',
      superadminOnly: true
    },
    {
      title: 'User Management',
      icon: Crown,
      href: '/admin',
      tab: 'management',
      superadminOnly: true
    },
    {
      title: 'Settings',
      icon: Settings,
      href: '/admin',
      tab: 'settings',
      superadminOnly: true
    },
  ];

  const menuItems = allMenuItems.filter((item: any) => isSuperAdmin || !item.superadminOnly);

  const handleNavigation = (item: any) => {
    console.log('🔄 Sidebar clicked:', item.title, 'Tab:', item.tab);
    if (typeof window === 'undefined') return;
    window.location.hash = `#${item.tab}`;
    try {
      const event = new CustomEvent('adminTabChange', { detail: item.tab });
      window.dispatchEvent(event);
      console.log('✅ Event dispatched:', event);
    } catch (error) {
      console.log('❌ Event dispatch failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/admin/login');
    } catch (e) {
      router.replace('/admin/login');
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-lg h-screen fixed left-0 top-0 z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Admin</h2>
            <p className="text-sm text-gray-600">NHSF(UK) Dharmic Games</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => handleNavigation(item)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <Icon className="h-4 w-4 mr-3" />
              {item.title}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin Access</p>
            <p className="text-xs text-gray-600">NHSF(UK) Dharmic Games</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
