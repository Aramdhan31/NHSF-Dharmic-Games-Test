import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { adminDb } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

// Columns to exclude (K-P = columns 11-16, 0-indexed = 10-15)
const EXCLUDE_COLUMNS = [10, 11, 12, 13, 14, 15]; // K, L, M, N, O, P

interface ContactData {
  universityName: string;
  zone: 'LZ' | 'SZ';
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactRole?: string;
  [key: string]: any; // For other fields
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get sheet names
    const sheetNames = workbook.SheetNames;
    console.log('📊 Excel sheets found:', sheetNames);

    // Process LZ and SZ sheets
    const results: { lz: ContactData[], sz: ContactData[] } = {
      lz: [],
      sz: []
    };

    for (const sheetName of sheetNames) {
      const sheetNameUpper = sheetName.toUpperCase();
      
      // Check if this is an LZ or SZ sheet
      if (sheetNameUpper.includes('LZ') || sheetNameUpper.includes('LONDON')) {
        const lzData = parseSheet(workbook.Sheets[sheetName], 'LZ');
        results.lz = lzData;
        console.log(`📊 Parsed ${lzData.length} universities from LZ sheet`);
      } else if (sheetNameUpper.includes('SZ') || sheetNameUpper.includes('SOUTH')) {
        const szData = parseSheet(workbook.Sheets[sheetName], 'SZ');
        results.sz = szData;
        console.log(`📊 Parsed ${szData.length} universities from SZ sheet`);
      }
    }

    // If no LZ/SZ sheets found, try to parse all sheets
    if (results.lz.length === 0 && results.sz.length === 0) {
      console.log('⚠️ No LZ/SZ sheets found, trying to parse all sheets...');
      for (const sheetName of sheetNames) {
        const data = parseSheet(workbook.Sheets[sheetName], 'LZ'); // Default to LZ
        if (data.length > 0) {
          results.lz.push(...data);
        }
      }
    }

    // Save to Firebase
    const savedCount = await saveContactsToFirebase(results);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${savedCount.total} university contacts`,
      data: {
        lz: results.lz.length,
        sz: results.sz.length,
        saved: savedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Error uploading Excel file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process Excel file' },
      { status: 500 }
    );
  }
}

function parseSheet(sheet: XLSX.WorkSheet, zone: 'LZ' | 'SZ'): ContactData[] {
  const data: ContactData[] = [];
  
  // Convert sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { 
    header: 1, // Use array format
    defval: '' // Default value for empty cells
  }) as any[][];

  if (jsonData.length < 2) {
    return data; // Need at least header row
  }

  // First row is headers
  const headers = jsonData[0] as string[];
  console.log('📊 Headers found:', headers);

  // Find university name column (usually first column or contains "university", "name", etc.)
  const universityNameIndex = headers.findIndex((h: string) => 
    h && (h.toLowerCase().includes('university') || h.toLowerCase().includes('name') || h.toLowerCase().includes('uni'))
  );

  if (universityNameIndex === -1) {
    console.log('⚠️ Could not find university name column');
    return data;
  }

  // Process data rows (skip header row)
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    
    // Skip empty rows
    if (!row || row.length === 0 || !row[universityNameIndex]) {
      continue;
    }

    const universityName = String(row[universityNameIndex]).trim();
    if (!universityName || universityName === '') {
      continue;
    }

    // Build contact data object, excluding columns K-P
    const contactData: ContactData = {
      universityName,
      zone
    };

    // Map all other columns (excluding K-P)
    headers.forEach((header, index) => {
      // Skip excluded columns (K-P = indices 10-15)
      if (EXCLUDE_COLUMNS.includes(index)) {
        return;
      }

      if (header && header.trim() !== '') {
        const headerKey = header.trim().toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        const value = row[index];
        if (value !== undefined && value !== null && value !== '') {
          // Map common contact fields
          if (headerKey.includes('contact') && headerKey.includes('person') || headerKey.includes('name')) {
            contactData.contactPerson = String(value).trim();
          } else if (headerKey.includes('email')) {
            contactData.contactEmail = String(value).trim();
          } else if (headerKey.includes('phone') || headerKey.includes('mobile') || headerKey.includes('number')) {
            contactData.contactPhone = String(value).trim();
          } else if (headerKey.includes('role') || headerKey.includes('position')) {
            contactData.contactRole = String(value).trim();
          } else {
            // Store other fields
            contactData[headerKey] = String(value).trim();
          }
        }
      }
    });

    if (contactData.universityName) {
      data.push(contactData);
    }
  }

  return data;
}

async function saveContactsToFirebase(contacts: { lz: ContactData[], sz: ContactData[] }): Promise<{ total: number, updated: number, created: number }> {
  let total = 0;
  let updated = 0;
  let created = 0;

  const allContacts = [
    ...contacts.lz.map(c => ({ ...c, zone: 'LZ+SZ' as const })),
    ...contacts.sz.map(c => ({ ...c, zone: 'LZ+SZ' as const }))
  ];

  for (const contact of allContacts) {
    try {
      const universityName = contact.universityName.trim();
      
      // Try to find existing university by name
      const universitiesRef = collection(db, 'universities');
      const q = query(universitiesRef, where('name', '==', universityName));
      const snapshot = await getDocs(q);

      const contactData = {
        contactPerson: contact.contactPerson || '',
        contactEmail: contact.contactEmail || '',
        contactPhone: contact.contactPhone || '',
        contactRole: contact.contactRole || '',
        contactDetails: {
          ...contact,
          uploadedAt: new Date().toISOString(),
          uploadedFrom: 'excel'
        },
        lastUpdated: new Date().toISOString()
      };

      if (!snapshot.empty) {
        // Update existing university
        const docRef = snapshot.docs[0];
        await updateDoc(docRef.ref, {
          ...contactData,
          zone: contact.zone
        });
        updated++;
        console.log(`✅ Updated contact details for ${universityName}`);
      } else {
        // Create new university document with contact details
        const docId = `uni-${universityName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        await setDoc(doc(db, 'universities', docId), {
          name: universityName,
          zone: contact.zone,
          ...contactData,
          isCompeting: false,
          status: 'affiliated',
          sports: [],
          teamInfo: {},
          members: 0,
          wins: 0,
          losses: 0,
          points: 0,
          createdAt: new Date().toISOString()
        });
        created++;
        console.log(`✅ Created new university document for ${universityName}`);
      }

      total++;
    } catch (error: any) {
      console.error(`❌ Error saving contact for ${contact.universityName}:`, error);
    }
  }

  return { total, updated, created };
}

