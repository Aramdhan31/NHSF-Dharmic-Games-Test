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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-orange-600" />
              <span>Sports Competition Role Briefs</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading content...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <div 
                className="role-briefs-content prose prose-lg max-w-none 
                  prose-headings:text-orange-600 prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                  prose-h1:text-3xl prose-h1:font-extrabold prose-h1:border-b-2 prose-h1:border-orange-200 prose-h1:pb-2
                  prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3
                  prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:text-gray-700 prose-ul:mb-4 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:text-gray-700 prose-ol:mb-4 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-gray-700 prose-li:mb-2 prose-li:leading-relaxed
                  prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline
                  prose-table:w-full prose-table:border-collapse prose-table:mb-4
                  prose-th:border prose-th:border-gray-300 prose-th:bg-orange-50 prose-th:p-2 prose-th:text-left prose-th:font-semibold
                  prose-td:border prose-td:border-gray-300 prose-td:p-2
                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                style={{
                  lineHeight: '1.75',
                }}
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

