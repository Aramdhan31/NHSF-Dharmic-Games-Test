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
    console.log('⚠️ Sheet has less than 2 rows');
    return data; // Need at least header row
  }

  // First row is headers
  const headers = jsonData[0] as string[];
  console.log('📊 Headers found:', headers);
  console.log('📊 Total columns:', headers.length);

  // Find column indices for specific fields
  const findColumnIndex = (patterns: string[]): number => {
    for (const pattern of patterns) {
      const index = headers.findIndex((h: string) => 
        h && h.toLowerCase().includes(pattern.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  const universityNameIndex = findColumnIndex(['university name', 'university', 'name', 'uni']);
  const contactPersonIndex = findColumnIndex(['main contact person name', 'contact person', 'contact name', 'name']);
  const contactEmailIndex = findColumnIndex(['main contact person email', 'contact email', 'email']);
  const contactPhoneIndex = findColumnIndex(['main contact person phone', 'contact phone', 'phone number', 'phone', 'mobile']);
  const contactRoleIndex = findColumnIndex(['main contact person role', 'contact role', 'role', 'position']);

  console.log('📊 Column indices:', {
    universityName: universityNameIndex,
    contactPerson: contactPersonIndex,
    contactEmail: contactEmailIndex,
    contactPhone: contactPhoneIndex,
    contactRole: contactRoleIndex
  });

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

    // Build contact data object
    const contactData: ContactData = {
      universityName,
      zone,
      contactPerson: contactPersonIndex !== -1 && row[contactPersonIndex] ? String(row[contactPersonIndex]).trim() : '',
      contactEmail: contactEmailIndex !== -1 && row[contactEmailIndex] ? String(row[contactEmailIndex]).trim() : '',
      contactPhone: contactPhoneIndex !== -1 && row[contactPhoneIndex] ? String(row[contactPhoneIndex]).trim() : '',
      contactRole: contactRoleIndex !== -1 && row[contactRoleIndex] ? String(row[contactRoleIndex]).trim() : ''
    };

    console.log(`📊 Parsed ${universityName}:`, {
      contactPerson: contactData.contactPerson,
      contactEmail: contactData.contactEmail,
      contactPhone: contactData.contactPhone,
      contactRole: contactData.contactRole
    });

    if (contactData.universityName) {
      data.push(contactData);
    }
  }

  console.log(`📊 Total universities parsed from ${zone} sheet:`, data.length);
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

  console.log(`📊 Saving ${allContacts.length} contacts to Firebase...`);

  for (const contact of allContacts) {
    try {
      const universityName = contact.universityName.trim();
      console.log(`📊 Processing: ${universityName}`);
      
      // Try to find existing university by name (case-insensitive)
      const universitiesRef = collection(db, 'universities');
      const allUniversities = await getDocs(universitiesRef);
      
      // Find matching university (case-insensitive)
      let matchingDoc = null;
      allUniversities.forEach(doc => {
        const data = doc.data();
        const docName = (data.name || '').trim().toLowerCase();
        const searchName = universityName.toLowerCase();
        if (docName === searchName) {
          matchingDoc = doc;
        }
      });

      const contactData = {
        contactPerson: contact.contactPerson || '',
        contactEmail: contact.contactEmail || '',
        contactPhone: contact.contactPhone || '',
        contactRole: contact.contactRole || '',
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`📊 Contact data for ${universityName}:`, contactData);

      if (matchingDoc) {
        // Update existing university
        await updateDoc(matchingDoc.ref, contactData);
        updated++;
        console.log(`✅ Updated contact details for ${universityName} (ID: ${matchingDoc.id})`);
      } else {
        // Try to find by partial name match (for variations like "KCL" vs "King's College London")
        const nameVariations = [
          universityName,
          universityName.replace(/&/g, 'and'),
          universityName.replace(/and/g, '&'),
          universityName.replace(/university of /i, ''),
          universityName.replace(/university/i, 'uni')
        ];
        
        let foundMatch = false;
        for (const variation of nameVariations) {
          allUniversities.forEach(doc => {
            const data = doc.data();
            const docName = (data.name || '').trim().toLowerCase();
            const searchName = variation.toLowerCase();
            if (docName.includes(searchName) || searchName.includes(docName)) {
              matchingDoc = doc;
              foundMatch = true;
            }
          });
          if (foundMatch) break;
        }

        if (matchingDoc && foundMatch) {
          // Update existing university with variation match
          await updateDoc(matchingDoc.ref, contactData);
          updated++;
          console.log(`✅ Updated contact details for ${universityName} (matched to: ${matchingDoc.data().name})`);
        } else {
          // Create new university document with contact details
          const docId = `uni-${universityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
          await setDoc(doc(db, 'universities', docId), {
            name: universityName,
            zone: contact.zone,
            ...contactData,
            isCompeting: true, // Assume competing if contact details are provided
            status: 'competing',
            sports: [],
            teamInfo: {},
            members: 0,
            wins: 0,
            losses: 0,
            points: 0,
            createdAt: new Date().toISOString()
          });
          created++;
          console.log(`✅ Created new university document for ${universityName} (ID: ${docId})`);
        }
      }

      total++;
    } catch (error: any) {
      console.error(`❌ Error saving contact for ${contact.universityName}:`, error);
    }
  }

  console.log(`📊 Saved ${total} contacts (${updated} updated, ${created} created)`);
  return { total, updated, created };
}

