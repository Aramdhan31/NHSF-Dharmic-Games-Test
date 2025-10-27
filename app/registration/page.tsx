"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  UserPlus, 
  Users, 
  ArrowRight,
  Building2,
  Gamepad2,
  Eye,
  Users2
} from 'lucide-react'

export default function RegistrationPage() {
  const router = useRouter()

  const registrationOptions = [
    {
      id: 'university',
      title: 'University Registration',
      description: 'Register your university to participate in the NHSF (UK) Dharmic Games',
      icon: GraduationCap,
      features: [
        'Register your university as a participating institution',
        'Manage your university teams and members',
        'Access university dashboard for team management',
        'Submit your university for admin approval'
      ],
      buttonText: 'Register University',
      buttonVariant: 'default' as const,
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      href: '/register'
    },
    {
      id: 'member',
      title: 'Individual Registration',
      description: 'Register as a spectator, referee, volunteer, or external participant',
      icon: UserPlus,
      features: [
        'Register as a spectator to watch the games',
        'Register as a referee for sports competitions',
        'Register as a volunteer to help with the event',
        'Register as an external participant (non-university)',
        'No approval needed - register and participate directly'
      ],
      buttonText: 'Register as Individual',
      buttonVariant: 'outline' as const,
      color: 'bg-gradient-to-br from-blue-500 to-purple-500',
      href: '/register-member'
    }
  ]

  const ticketTypes = [
    {
      type: 'spectator', 
      label: 'Spectator Ticket',
      icon: Eye,
      description: 'For those watching the games',
      color: 'text-blue-600'
    },
    {
      type: 'referee_volunteer_external',
      label: 'Referee/Volunteer/External Ticket',
      icon: Users2,
      description: 'For referees, volunteers, and external participants',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Registration
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose how you'd like to participate in the NHSF (UK) Dharmic Games. 
            Register as a university or as an individual member.
          </p>
        </div>

        {/* Registration Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {registrationOptions.map((option) => {
            const Icon = option.icon
            
            return (
              <Card key={option.id} className="relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                <div className={`absolute top-0 left-0 right-0 h-1 ${option.color}`}></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-2xl ${option.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {option.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-base">
                        {option.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">What you can do:</h4>
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => router.push(option.href)}
                    variant={option.buttonVariant}
                    size="lg"
                    className="w-full h-12 font-semibold group"
                  >
                    <span>{option.buttonText}</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Individual Registration Details */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2 text-orange-600" />
              Individual Registration Options
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choose the type of ticket that applies to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ticketTypes.map((ticket) => {
                const Icon = ticket.icon
                
                return (
                  <div key={ticket.type} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon className={`h-8 w-8 ${ticket.color}`} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{ticket.label}</h3>
                        <p className="text-sm text-gray-600">{ticket.description}</p>
                      </div>
                    </div>
                    
                    {ticket.type === 'participant' && (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs">
                          Requires University
                        </Badge>
                        <Badge variant="outline" className="text-xs ml-2">
                          Sport Selection
                        </Badge>
                      </div>
                    )}
                    
                    {ticket.type === 'spectator' && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        No Approval Needed
                      </Badge>
                    )}
                    
                    {ticket.type === 'referee_volunteer_external' && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                        External Participant
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <Card className="bg-white/90 shadow-lg border border-gray-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Not sure which registration type applies to you? We're here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
                >
                  Back to Home
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = 'mailto:arjun.ramdhan@nhsf.org.uk'}
                  className="border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
