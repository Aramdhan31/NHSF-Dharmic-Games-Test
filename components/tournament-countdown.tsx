'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock } from 'lucide-react'

interface CountdownProps {
  targetDate: Date
  title: string
  venue: string
  address: string
  zone: string
  color: string
  gradient: string
}

const CountdownCard: React.FC<CountdownProps> = ({ targetDate, title, venue, address, zone, color, gradient }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <Card className={`${gradient} border-2 ${color} hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-white/90" />
            <h3 className="font-bold text-lg text-white">{title}</h3>
          </div>
          <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs font-semibold">
            {zone}
          </Badge>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-white/90" />
            <span className="text-sm font-medium text-white/95">{venue}</span>
          </div>
          <p className="text-xs text-white/80 ml-6">{address}</p>
        </div>

        {isExpired ? (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-white">Tournament Started!</p>
            <p className="text-sm text-white/80">Check live results</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{timeLeft.days}</div>
              <div className="text-xs text-white/80">Days</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{timeLeft.hours}</div>
              <div className="text-xs text-white/80">Hours</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{timeLeft.minutes}</div>
              <div className="text-xs text-white/80">Minutes</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <div className="text-2xl font-bold text-white">{timeLeft.seconds}</div>
              <div className="text-xs text-white/80">Seconds</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TournamentCountdown() {
  // Tournament dates
  const northCentralDate = new Date('November 22, 2025 08:30:00') // NZ+CZ
  const londonSouthDate = new Date('November 23, 2025 08:30:00') // LZ+SZ
  
  // Debug: Log current date and tournament dates
  console.log('Current date:', new Date())
  console.log('North Central date:', northCentralDate)
  console.log('London South date:', londonSouthDate)
  console.log('Current time:', new Date().getTime())
  console.log('North Central time:', northCentralDate.getTime())
  console.log('Time difference (NC):', northCentralDate.getTime() - new Date().getTime())

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto px-4">
      <CountdownCard
        targetDate={northCentralDate}
        title="North & Central Zone"
        venue="Avanti Field School"
        address="21 Bhaktivedanta Marg, Leicester, LE5 0BX, England"
        zone="Nov 22, 2025"
        color="border-red-500"
        gradient="bg-gradient-to-r from-red-500 to-green-500"
      />
      <CountdownCard
        targetDate={londonSouthDate}
        title="London & South Zone"
        venue="Queen Park Community School"
        address="Aylestone Ave, London NW6 7BQ, England"
        zone="Nov 23, 2025"
        color="border-blue-500"
        gradient="bg-gradient-to-r from-blue-500 to-yellow-500"
      />
    </div>
  )
}
