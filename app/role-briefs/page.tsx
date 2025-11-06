"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function RoleBriefsPage() {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch('/api/role-briefs')
        if (!response.ok) {
          throw new Error('Failed to load content')
        }
        const data = await response.json()
        setHtmlContent(data.html)
      } catch (err) {
        console.error('Error fetching role briefs:', err)
        setError('Failed to load role briefs content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Sports Competition Role Briefs</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive guide to all competition roles and responsibilities</p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-6 sm:p-8 lg:p-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-600 mb-4" />
                <span className="text-gray-600 font-medium">Loading content...</span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-red-600 font-semibold text-lg">{error}</p>
                <p className="text-gray-500 mt-2">Please try refreshing the page</p>
              </div>
            ) : (
              <div 
                className="role-briefs-content"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  )
}

