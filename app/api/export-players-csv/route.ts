import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-server'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { isAdmin } from '@/lib/admin-config'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Extract email from the token (assuming it's base64 encoded email for simplicity)
    const token = authHeader.split(' ')[1]
    const email = atob(token)
    
    // Check if user is admin
    if (!isAdmin(email)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Fetch all player data from different collections
    const allPlayers: any[] = []

    // 1. Get members (general registrations)
    const membersRef = collection(db, 'members')
    const membersSnapshot = await getDocs(query(membersRef, orderBy('registrationDate', 'desc')))
    membersSnapshot.forEach((doc) => {
      const data = doc.data()
      allPlayers.push({
        id: doc.id,
        source: 'General Registration',
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        ticketType: data.ticketType || '',
        university: data.university || '',
        sport: data.sport || '',
        emergencyContactName: data.emergencyContactName || '',
        emergencyContactNumber: data.emergencyContactNumber || '',
        registrationDate: data.registrationDate?.toDate?.()?.toISOString() || '',
        status: data.status || '',
        universityId: data.universityId || ''
      })
    })

    // 2. Get on-day players
    const onDayPlayersRef = collection(db, 'onDayPlayers')
    const onDayPlayersSnapshot = await getDocs(query(onDayPlayersRef, orderBy('checkInDate', 'desc')))
    onDayPlayersSnapshot.forEach((doc) => {
      const data = doc.data()
      allPlayers.push({
        id: doc.id,
        source: 'On-Day Registration',
        fullName: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        ticketType: 'participant',
        university: data.university || '',
        sport: Array.isArray(data.sports) ? data.sports.join(', ') : data.sports || '',
        emergencyContactName: data.emergencyContact || '',
        emergencyContactNumber: data.emergencyPhone || '',
        registrationDate: data.checkInDate?.toDate?.()?.toISOString() || '',
        status: data.status || '',
        studentId: data.studentId || '',
        year: data.year || '',
        course: data.course || '',
        medicalInfo: data.medicalInfo || ''
      })
    })

    // 3. Get university players (from universities collection)
    const universitiesRef = collection(db, 'universities')
    const universitiesSnapshot = await getDocs(universitiesRef)
    
    for (const universityDoc of universitiesSnapshot.docs) {
      const universityData = universityDoc.data()
      const universityName = universityData.name || 'Unknown University'
      
      if (universityData.players && typeof universityData.players === 'object') {
        Object.entries(universityData.players).forEach(([sport, players]: [string, any]) => {
          if (Array.isArray(players)) {
            players.forEach((player: any) => {
              allPlayers.push({
                id: `${universityDoc.id}_${player.id || Date.now()}`,
                source: 'University Registration',
                fullName: player.name || '',
                email: player.email || '',
                phone: player.phone || '',
                ticketType: 'participant',
                university: universityName,
                sport: sport,
                emergencyContactName: player.emergencyContactName || '',
                emergencyContactNumber: player.emergencyContactPhone || '',
                emergencyContactRelation: player.emergencyContactRelation || '',
                emergencyContactEmail: player.emergencyContactEmail || '',
                registrationDate: new Date(player.addedAt || Date.now()).toISOString(),
                status: 'registered',
                universityId: universityDoc.id,
                hasAllergies: player.hasAllergies || false,
                allergies: player.allergies || '',
                hasMedicalConditions: player.hasMedicalConditions || false,
                medicalConditions: player.medicalConditions || '',
                agreedToDisclaimer: player.agreedToDisclaimer || false
              })
            })
          }
        })
      }
    }

    // 4. Get players from players collection (game players)
    const playersRef = collection(db, 'players')
    const playersSnapshot = await getDocs(query(playersRef, orderBy('createdAt', 'desc')))
    playersSnapshot.forEach((doc) => {
      const data = doc.data()
      allPlayers.push({
        id: doc.id,
        source: 'Game Players',
        fullName: data.name || '',
        email: data.email || '',
        phone: '',
        ticketType: 'participant',
        university: '',
        sport: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        registrationDate: data.createdAt?.toDate?.()?.toISOString() || '',
        status: data.isActive ? 'active' : 'inactive',
        zone: data.zone || '',
        score: data.score || 0,
        wins: data.wins || 0,
        losses: data.losses || 0
      })
    })

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Source',
      'Full Name',
      'Email',
      'Phone',
      'Ticket Type',
      'University',
      'Sport',
      'Emergency Contact Name',
      'Emergency Contact Number',
      'Emergency Contact Relation',
      'Emergency Contact Email',
      'Registration Date',
      'Status',
      'University ID',
      'Student ID',
      'Year',
      'Course',
      'Medical Info',
      'Has Allergies',
      'Allergies',
      'Has Medical Conditions',
      'Medical Conditions',
      'Agreed to Disclaimer',
      'Zone',
      'Score',
      'Wins',
      'Losses'
    ]

    const csvRows = allPlayers.map(player => [
      player.id || '',
      player.source || '',
      player.fullName || '',
      player.email || '',
      player.phone || '',
      player.ticketType || '',
      player.university || '',
      player.sport || '',
      player.emergencyContactName || '',
      player.emergencyContactNumber || '',
      player.emergencyContactRelation || '',
      player.emergencyContactEmail || '',
      player.registrationDate || '',
      player.status || '',
      player.universityId || '',
      player.studentId || '',
      player.year || '',
      player.course || '',
      player.medicalInfo || '',
      player.hasAllergies || false,
      player.allergies || '',
      player.hasMedicalConditions || false,
      player.medicalConditions || '',
      player.agreedToDisclaimer || false,
      player.zone || '',
      player.score || 0,
      player.wins || 0,
      player.losses || 0
    ])

    // Escape CSV values
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n')

    // Set response headers for CSV download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="nhsf-players-export-${new Date().toISOString().split('T')[0]}.csv"`)
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')

    return new Response(csvContent, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('Error generating CSV export:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV export' },
      { status: 500 }
    )
  }
}
