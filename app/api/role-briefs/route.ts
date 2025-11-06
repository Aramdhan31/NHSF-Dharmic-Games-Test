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
    
    // Convert .docx to HTML with options to preserve all content
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "r[style-name='Strong'] => strong",
        ],
        includeDefaultStyleMap: true,
      }
    )
    
    const html = result.value
    const messages = result.messages
    
    // Log any warnings or messages
    if (messages && messages.length > 0) {
      console.log('Mammoth conversion messages:', messages)
    }
    
    // Return the HTML content
    return NextResponse.json({ html, messages })
  } catch (error) {
    console.error('Error converting .docx to HTML:', error)
    return NextResponse.json(
      { error: 'Failed to convert document' },
      { status: 500 }
    )
  }
}

