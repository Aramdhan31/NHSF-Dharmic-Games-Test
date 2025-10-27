"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDynamicUpdates, getUpdateStatus } from '@/lib/dynamic-updates';

interface DynamicUpdateStatusProps {
  showDetails?: boolean;
}

export function DynamicUpdateStatus({ showDetails = false }: DynamicUpdateStatusProps) {
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get initial status
    const status = getUpdateStatus();
    setUpdateStatus(status);
    setIsConnected(status.activeListeners > 0);

    // Update status every 5 seconds
    const interval = setInterval(() => {
      const newStatus = getUpdateStatus();
      setUpdateStatus(newStatus);
      setIsConnected(newStatus.activeListeners > 0);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const { lastUpdate: componentUpdate } = useDynamicUpdates('dynamic-status');

  useEffect(() => {
    if (componentUpdate) {
      setLastUpdate(componentUpdate);
    }
  }, [componentUpdate]);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (!isConnected) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    if (lastUpdate && Date.now() - lastUpdate.timestamp < 30000) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (lastUpdate && Date.now() - lastUpdate.timestamp < 30000) return 'Active';
    return 'Waiting';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (lastUpdate && Date.now() - lastUpdate.timestamp < 30000) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className="text-gray-600">Dynamic Updates:</span>
        <Badge className={`${getStatusColor()} text-white`}>
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Dynamic Update Status
          <Badge className={`${getStatusColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Connection Status</span>
          </div>
          <Badge className={isConnected ? 'bg-green-500' : 'bg-red-500'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Active Listeners */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Active Listeners</span>
          <Badge className="bg-blue-500">
            {updateStatus?.activeListeners || 0}
          </Badge>
        </div>

        {/* Component States */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Component States</span>
          <Badge className="bg-purple-500">
            {updateStatus?.componentStates || 0}
          </Badge>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Last Update</span>
          <span className="text-xs text-gray-500">
            {formatTime(updateStatus?.lastUpdate)}
          </span>
        </div>

        {/* Recent Updates */}
        {lastUpdate && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Recent Update</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge className="bg-orange-500">{lastUpdate.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Action:</span>
                <span className="text-gray-600">{lastUpdate.action}</span>
              </div>
              <div className="flex justify-between">
                <span>Affects:</span>
                <span className="text-gray-600">{lastUpdate.affects?.length || 0} components</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="text-gray-600">{formatTime(lastUpdate.timestamp)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          onClick={() => {
            const newStatus = getUpdateStatus();
            setUpdateStatus(newStatus);
            setIsConnected(newStatus.activeListeners > 0);
          }}
          size="sm"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}
