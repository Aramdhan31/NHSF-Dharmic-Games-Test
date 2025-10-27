"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X, Check, Trash2, Settings, Volume2, VolumeX } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { useNotificationPreferences } from "@/hooks/use-local-storage"

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const {
    notifications,
    permission,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadCount,
    getRecentNotifications,
    simulateNotification,
    requestPermission
  } = useNotifications()

  const { preferences, updatePreferences } = useNotificationPreferences()

  const unreadCount = getUnreadCount()
  const recentNotifications = getRecentNotifications(20)

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match_start':
        return '🏁'
      case 'score_update':
        return '⚽'
      case 'match_end':
        return '🏆'
      case 'tournament_update':
        return '📢'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match_start':
        return 'bg-green-100 text-green-800'
      case 'score_update':
        return 'bg-blue-100 text-blue-800'
      case 'match_end':
        return 'bg-purple-100 text-purple-800'
      case 'tournament_update':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={simulateNotification}
              className="text-xs"
            >
              Test Notification
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Notification Settings */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Notification Settings</h3>
              <Settings className="w-4 h-4 text-gray-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Browser Notifications</span>
                <div className="flex items-center space-x-2">
                  {permission === 'granted' ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      Enabled
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestPermission}
                      className="text-xs"
                    >
                      Enable
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Sound Notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePreferences({ sound: !preferences.sound })}
                  className="p-1"
                >
                  {preferences.sound ? (
                    <Volume2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark All Read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              disabled={notifications.length === 0}
              className="text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-96">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications yet</p>
                <p className="text-sm">You'll receive updates about your favorite teams</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white border-blue-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getNotificationColor(notification.type)}`}
                            >
                              {notification.type.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center">
            Notifications are saved locally on your device. No login required!
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
