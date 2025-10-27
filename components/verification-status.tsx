"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Clock, XCircle, AlertTriangle, Shield } from 'lucide-react'

interface VerificationStatusProps {
  status: 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function VerificationStatus({ 
  status, 
  rejectionReason, 
  showDetails = false,
  size = 'md'
}: VerificationStatusProps) {
  
  const getStatusBadge = () => {
    const baseClasses = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
    
    switch (status) {
      case 'verified':
        return (
          <Badge className={`bg-green-100 text-green-800 ${baseClasses}`}>
            <CheckCircle className={`${iconSize} mr-1`} />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge className={`bg-yellow-100 text-yellow-800 ${baseClasses}`}>
            <Clock className={`${iconSize} mr-1`} />
            Pending Review
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className={`bg-red-100 text-red-800 ${baseClasses}`}>
            <XCircle className={`${iconSize} mr-1`} />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className={baseClasses}>
            {status}
          </Badge>
        )
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'verified':
        return {
          title: '✅ Player Verified',
          description: 'This player has been verified and can compete in tournaments.',
          type: 'success' as const
        }
      case 'pending':
        return {
          title: '⏳ Pending Verification',
          description: 'Player has signed up and is awaiting admin review. They can register but cannot compete until verified.',
          type: 'warning' as const
        }
      case 'rejected':
        return {
          title: '❌ Verification Rejected',
          description: rejectionReason || 'Player verification was rejected. Contact admin for details.',
          type: 'error' as const
        }
      default:
        return {
          title: 'Unknown Status',
          description: 'Verification status is unclear.',
          type: 'warning' as const
        }
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <div className="space-y-2">
      {getStatusBadge()}
      
      {showDetails && (
        <Alert className={statusInfo.type === 'success' ? 'border-green-200 bg-green-50' : 
                         statusInfo.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                         'border-red-200 bg-red-50'}>
          {statusInfo.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : statusInfo.type === 'warning' ? (
            <Clock className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>{statusInfo.title}</strong><br />
            {statusInfo.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Helper component for showing verification concerns
export function VerificationConcerns({ status }: { status: 'pending' | 'verified' | 'rejected' }) {
  if (status === 'verified') {
    return null
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Verification Required</strong><br />
        {status === 'pending' 
          ? 'This player has signed up and is awaiting admin review. They can register but cannot compete until verified.'
          : 'This player was rejected and cannot compete. Please contact admin for resolution.'
        }
      </AlertDescription>
    </Alert>
  )
}

// Helper component for showing overall verification status
export function TeamVerificationStatus({ 
  players, 
  showConcerns = true 
}: { 
  players: Array<{ verificationStatus: 'pending' | 'verified' | 'rejected' }>
  showConcerns?: boolean 
}) {
  const verifiedCount = players.filter(p => p.verificationStatus === 'verified').length
  const pendingCount = players.filter(p => p.verificationStatus === 'pending').length
  const rejectedCount = players.filter(p => p.verificationStatus === 'rejected').length
  const totalCount = players.length

  if (totalCount === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>No Players Registered</strong><br />
          Register players to start building your team.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Team Verification Status</h4>
        <div className="flex space-x-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {verifiedCount} Verified
          </Badge>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} Pending
            </Badge>
          )}
          {rejectedCount > 0 && (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              {rejectedCount} Rejected
            </Badge>
          )}
        </div>
      </div>

      {showConcerns && (pendingCount > 0 || rejectedCount > 0) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verification Required</strong><br />
            {pendingCount > 0 && `${pendingCount} player(s) need admin verification before they can compete. `}
            {rejectedCount > 0 && `${rejectedCount} player(s) were rejected and need to be re-registered. `}
            Players can sign up but cannot play until verified.
          </AlertDescription>
        </Alert>
      )}

      {verifiedCount === totalCount && totalCount > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>All Players Verified! 🎉</strong><br />
            Your team is ready to compete in tournaments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
