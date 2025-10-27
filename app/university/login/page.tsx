"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UniversityLogin() {
  const router = useRouter()
  
  // Redirect to simplified login
  useEffect(() => {
    router.push('/university/login-simple')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to simplified login...</p>
      </div>
    </div>
  )
}