"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ChevronDown } from 'lucide-react'

interface ZoneSwitcherProps {
  currentZone: string
  availableZones: string[]
  onZoneChange: (zone: string) => void
  className?: string
}

export function ZoneSwitcher({ currentZone, availableZones, onZoneChange, className = '' }: ZoneSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getZoneDisplayName = (zone: string) => {
    switch (zone) {
      case 'NZ+CZ':
        return 'North & Central Zone'
      case 'LZ+SZ':
        return 'London & South Zone'
      case 'ALL':
        return 'All Zones'
      default:
        return zone
    }
  }

  const getZoneBadgeColor = (zone: string) => {
    switch (zone) {
      case 'NZ+CZ':
        return 'bg-blue-100 text-blue-800'
      case 'LZ+SZ':
        return 'bg-green-100 text-green-800'
      case 'ALL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (availableZones.length <= 1) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MapPin className="h-4 w-4 text-gray-600" />
        <Badge className={getZoneBadgeColor(currentZone)}>
          {getZoneDisplayName(currentZone)}
        </Badge>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <MapPin className="h-4 w-4" />
        <span>{getZoneDisplayName(currentZone)}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Switch Zone
              </div>
              
              {availableZones.map((zone) => (
                <button
                  key={zone}
                  onClick={() => {
                    onZoneChange(zone)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${
                    currentZone === zone ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                  }`}
                >
                  <span>{getZoneDisplayName(zone)}</span>
                  <Badge className={getZoneBadgeColor(zone)}>
                    {zone}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
