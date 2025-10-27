"use client"

import { useEffect, useState } from 'react'
import { useFavoriteUniversities } from './use-local-storage'

interface NotificationData {
  id: string
  type: 'match_start' | 'score_update' | 'match_end' | 'tournament_update'
  title: string
  message: string
  timestamp: number
  universityId?: string
  tournament?: string
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const { favorites, isFavorite } = useFavoriteUniversities()

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      }
    }
  }, [])

  // Check localStorage for existing notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('notifications')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setNotifications(parsed)
        } catch (error) {
          console.error('Error parsing stored notifications:', error)
        }
      }
    }
  }, [])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show browser notification if permission granted and relevant to user
    if (permission === 'granted' && shouldShowNotification(newNotification)) {
      showBrowserNotification(newNotification)
    }
  }

  const shouldShowNotification = (notification: NotificationData) => {
    // Show notifications for favorite universities
    if (notification.universityId && isFavorite(notification.universityId)) {
      return true
    }

    // Show tournament updates if user follows the tournament
    if (notification.type === 'tournament_update') {
      const followed = localStorage.getItem('followed-tournaments')
      if (followed && notification.tournament) {
        const followedTournaments = JSON.parse(followed)
        return followedTournaments.includes(notification.tournament)
      }
    }

    // Show live match updates
    if (notification.type === 'match_start' || notification.type === 'match_end') {
      return true
    }

    return false
  }

  const showBrowserNotification = (notification: NotificationData) => {
    if (typeof window !== 'undefined' && 'Notification' in window && permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/placeholder-logo.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      })
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length
  }

  const getNotificationsForUniversity = (universityId: string) => {
    return notifications.filter(notif => notif.universityId === universityId)
  }

  const getRecentNotifications = (limit: number = 10) => {
    return notifications.slice(0, limit)
  }

  // Simulate real-time notifications (for demo purposes)
  const simulateNotification = () => {
    const types = ['match_start', 'score_update', 'match_end', 'tournament_update'] as const
    const randomType = types[Math.floor(Math.random() * types.length)]
    
    const sampleNotifications = {
      match_start: {
        title: 'Match Started!',
        message: 'A new match has begun in your favorite tournament.',
        universityId: favorites[Math.floor(Math.random() * favorites.length)] || '1'
      },
      score_update: {
        title: 'Score Update!',
        message: 'Your favorite team just scored!',
        universityId: favorites[Math.floor(Math.random() * favorites.length)] || '1'
      },
      match_end: {
        title: 'Match Completed!',
        message: 'A match has finished. Check the results!',
        universityId: favorites[Math.floor(Math.random() * favorites.length)] || '1'
      },
      tournament_update: {
        title: 'Tournament Update!',
        message: 'New information available about the tournament.',
        tournament: 'LZ+SZ'
      }
    }

    addNotification(sampleNotifications[randomType])
  }

  return {
    notifications,
    permission,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadCount,
    getNotificationsForUniversity,
    getRecentNotifications,
    simulateNotification,
    requestPermission: () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        Notification.requestPermission().then(setPermission)
      }
    }
  }
}
