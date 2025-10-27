"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFirebase } from '@/lib/firebase-context'

interface CSVExportProps {
  className?: string
}

export default function CSVExport({ className }: CSVExportProps) {
  const { user } = useFirebase()
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleExportCSV = async () => {
    if (!user?.email) {
      setExportStatus('error')
      setErrorMessage('User not authenticated')
      return
    }

    setIsExporting(true)
    setExportStatus('idle')
    setErrorMessage('')

    try {
      // Create a simple token by base64 encoding the email
      const token = btoa(user.email)
      
      const response = await fetch('/api/export-players-csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export CSV')
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `nhsf-players-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setExportStatus('success')
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setExportStatus('idle')
      }, 3000)

    } catch (error: any) {
      console.error('CSV export error:', error)
      setExportStatus('error')
      setErrorMessage(error.message || 'Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <span>Export Player Data</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Download a comprehensive CSV file containing all registered players from:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>General member registrations</li>
            <li>University player registrations</li>
            <li>On-the-day registrations</li>
            <li>Game players</li>
          </ul>
        </div>

        {exportStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              CSV file downloaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {exportStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating CSV...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Player Data CSV
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500">
          <p><strong>Note:</strong> This export includes all player information including personal details, emergency contacts, and medical information. Handle with care and ensure compliance with data protection regulations.</p>
        </div>
      </CardContent>
    </Card>
  )
}
