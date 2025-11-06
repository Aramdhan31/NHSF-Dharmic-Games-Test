import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the .docx file
    const filePath = path.join(process.cwd(), 'Sports Competition Role Briefs.docx')
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(filePath)
    
    // Convert .docx to HTML
    const result = await mammoth.convertToHtml({ buffer })
    const html = result.value
    
    // Return the HTML content
    return NextResponse.json({ html })
  } catch (error) {
    console.error('Error converting .docx to HTML:', error)
    return NextResponse.json(
      { error: 'Failed to convert document' },
      { status: 500 }
    )
  }
}

