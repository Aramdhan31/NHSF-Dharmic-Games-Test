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
  contacts?: Array<{
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactRole?: string;
  }>;
  [key: string]: any; // For other fields from spreadsheet
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

  // Find university name - could be "Chapter" or "University Name" or "Name"
  const universityNameIndex = findColumnIndex(['chapter', 'university name', 'university', 'name', 'uni']);
  
  // Find main contact person - could be "Name" or "1st POC" related
  const contactPersonIndex = findColumnIndex(['name', 'main contact person name', 'contact person', 'contact name', '1st poc name', 'first poc name']);
  
  // Find main contact email - "1st POC - Email"
  const contactEmailIndex = findColumnIndex(['1st poc - email', '1st poc email', 'first poc email', 'main contact person email', 'contact email', 'email', '1st poc', 'first poc']);
  
  // Find main contact phone - "1st POC - Phone Number"
  const contactPhoneIndex = findColumnIndex(['1st poc - phone number', '1st poc phone', 'first poc phone', 'main contact person phone', 'contact phone', 'phone number', 'phone', 'mobile', '1st poc - phone']);
  
  // Find main contact role - could be "Role"
  const contactRoleIndex = findColumnIndex(['role', 'main contact person role', 'contact role', 'position', '1st poc role']);
  
  // Find second contact email - "2nd POC - Email"
  const secondContactEmailIndex = findColumnIndex([
    '2nd poc - email',
    '2nd poc email', 
    'second poc email',
    'second contact person email', 
    'contact 2 email', 
    'additional contact email',
    'second contact email',
    '2nd contact email',
    'poc 2 email',
    'second poc - email'
  ]);
  
  // Find second contact phone - "2nd POC - Phone Number"
  const secondContactPhoneIndex = findColumnIndex([
    '2nd poc - phone number',
    '2nd poc phone',
    'second poc phone',
    'second contact person phone', 
    'contact 2 phone', 
    'additional contact phone',
    'second contact phone',
    '2nd contact phone',
    'poc 2 phone',
    '2nd poc - phone',
    'second poc - phone number'
  ]);
  
  // Second contact person name - might not be in spreadsheet, but check anyway
  const secondContactPersonIndex = findColumnIndex([
    '2nd poc name',
    'second poc name',
    'second contact person name', 
    'contact person 2', 
    'contact 2 name', 
    'additional contact',
    'second contact',
    '2nd contact person',
    'poc 2 name'
  ]);
  
  // Second contact role - might not be in spreadsheet
  const secondContactRoleIndex = findColumnIndex([
    '2nd poc role',
    'second poc role',
    'second contact person role', 
    'contact 2 role', 
    'additional contact role',
    'second contact role',
    '2nd contact role',
    'poc 2 role'
  ]);

  console.log('📊 Column indices:', {
    universityName: universityNameIndex,
    contactPerson: contactPersonIndex,
    contactEmail: contactEmailIndex,
    contactPhone: contactPhoneIndex,
    contactRole: contactRoleIndex,
    secondContactPerson: secondContactPersonIndex,
    secondContactEmail: secondContactEmailIndex,
    secondContactPhone: secondContactPhoneIndex,
    secondContactRole: secondContactRoleIndex
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
    
    // Capture all columns A-J (indices 0-9) except excluded columns
    // Store additional fields from spreadsheet
    const additionalFields: any = {};
    for (let colIndex = 0; colIndex < Math.min(headers.length, 10); colIndex++) {
      // Skip excluded columns (K-P = indices 10-15)
      if (EXCLUDE_COLUMNS.includes(colIndex)) {
        continue;
      }
      
      // Skip columns we're already capturing
      if (colIndex === universityNameIndex || 
          colIndex === contactPersonIndex || 
          colIndex === contactEmailIndex || 
          colIndex === contactPhoneIndex || 
          colIndex === contactRoleIndex ||
          colIndex === secondContactPersonIndex ||
          colIndex === secondContactEmailIndex ||
          colIndex === secondContactPhoneIndex ||
          colIndex === secondContactRoleIndex) {
        continue;
      }
      
      // Capture other fields
      const headerName = headers[colIndex] ? String(headers[colIndex]).trim() : '';
      const cellValue = row[colIndex] ? String(row[colIndex]).trim() : '';
      if (headerName && cellValue) {
        // Convert header to camelCase for storage
        const fieldName = headerName.toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
        additionalFields[fieldName] = cellValue;
      }
    }

    // Build contact data object
    const mainContact = {
      contactPerson: contactPersonIndex !== -1 && row[contactPersonIndex] ? String(row[contactPersonIndex]).trim() : '',
      contactEmail: contactEmailIndex !== -1 && row[contactEmailIndex] ? String(row[contactEmailIndex]).trim() : '',
      contactPhone: contactPhoneIndex !== -1 && row[contactPhoneIndex] ? String(row[contactPhoneIndex]).trim() : '',
      contactRole: contactRoleIndex !== -1 && row[contactRoleIndex] ? String(row[contactRoleIndex]).trim() : ''
    };
    
    // Build second contact if available - prioritize email and phone from "2nd POC" columns
    const secondContact = {
      contactPerson: secondContactPersonIndex !== -1 && row[secondContactPersonIndex] ? String(row[secondContactPersonIndex]).trim() : '',
      contactEmail: secondContactEmailIndex !== -1 && row[secondContactEmailIndex] ? String(row[secondContactEmailIndex]).trim() : '',
      contactPhone: secondContactPhoneIndex !== -1 && row[secondContactPhoneIndex] ? String(row[secondContactPhoneIndex]).trim() : '',
      contactRole: secondContactRoleIndex !== -1 && row[secondContactRoleIndex] ? String(row[secondContactRoleIndex]).trim() : ''
    };
    
    // Log what we found for debugging
    console.log(`📊 ${universityName} - Main contact:`, {
      person: mainContact.contactPerson,
      email: mainContact.contactEmail,
      phone: mainContact.contactPhone,
      role: mainContact.contactRole
    });
    console.log(`📊 ${universityName} - Second contact:`, {
      person: secondContact.contactPerson,
      email: secondContact.contactEmail,
      phone: secondContact.contactPhone,
      role: secondContact.contactRole
    });
    console.log(`📊 ${universityName} - Has second contact:`, 
      !!(secondContact.contactPerson || secondContact.contactEmail || secondContact.contactPhone));
    
    // Build contacts array if we have multiple contacts
    const contacts: any[] = [];
    if (mainContact.contactPerson || mainContact.contactEmail || mainContact.contactPhone) {
      contacts.push(mainContact);
    }
    if (secondContact.contactPerson || secondContact.contactEmail || secondContact.contactPhone) {
      contacts.push(secondContact);
    }
    console.log(`📊 ${universityName} - Total contacts array length:`, contacts.length);
    
    // Check if we already have this university in the data (for merging multiple rows)
    const existingIndex = data.findIndex(d => d.universityName.toLowerCase() === universityName.toLowerCase());
    
    if (existingIndex >= 0) {
      // Merge with existing university - add new contacts if they don't already exist
      const existing = data[existingIndex];
      const existingContacts = existing.contacts || [];
      
      // Add main contact if it's not already in the list
      if (mainContact.contactPerson || mainContact.contactEmail || mainContact.contactPhone) {
        const mainContactExists = existingContacts.some((c: any) => 
          (c.contactEmail && mainContact.contactEmail && c.contactEmail.toLowerCase() === mainContact.contactEmail.toLowerCase()) ||
          (c.contactPhone && mainContact.contactPhone && c.contactPhone === mainContact.contactPhone)
        );
        if (!mainContactExists) {
          existingContacts.push(mainContact);
        }
      }
      
      // Add second contact if it's not already in the list
      if (secondContact.contactPerson || secondContact.contactEmail || secondContact.contactPhone) {
        const secondContactExists = existingContacts.some((c: any) => 
          (c.contactEmail && secondContact.contactEmail && c.contactEmail.toLowerCase() === secondContact.contactEmail.toLowerCase()) ||
          (c.contactPhone && secondContact.contactPhone && c.contactPhone === secondContact.contactPhone)
        );
        if (!secondContactExists) {
          existingContacts.push(secondContact);
        }
      }
      
      // Update existing entry with merged contacts
      data[existingIndex] = {
        ...existing,
        contacts: existingContacts.length > 0 ? existingContacts : undefined,
        // Update main contact fields if they're empty
        contactPerson: existing.contactPerson || mainContact.contactPerson,
        contactEmail: existing.contactEmail || mainContact.contactEmail,
        contactPhone: existing.contactPhone || mainContact.contactPhone,
        contactRole: existing.contactRole || mainContact.contactRole
      };
      
      console.log(`📊 Merged ${universityName}: Now has ${existingContacts.length} contacts`);
    } else {
      // New university entry
      const contactData: ContactData = {
        universityName,
        zone,
        contactPerson: mainContact.contactPerson,
        contactEmail: mainContact.contactEmail,
        contactPhone: mainContact.contactPhone,
        contactRole: mainContact.contactRole,
        contacts: contacts.length > 0 ? contacts : undefined,
        ...additionalFields // Include all other fields from spreadsheet
      };

      console.log(`📊 Parsed ${universityName}:`, {
        contactPerson: contactData.contactPerson,
        contactEmail: contactData.contactEmail,
        contactPhone: contactData.contactPhone,
        contactRole: contactData.contactRole,
        contactsCount: contacts.length,
        secondContact: secondContact.contactPerson || secondContact.contactEmail || secondContact.contactPhone ? 'Found' : 'Not found'
      });

      if (contactData.universityName) {
        data.push(contactData);
      }
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

      const contactData: any = {
        contactPerson: contact.contactPerson || '',
        contactEmail: contact.contactEmail || '',
        contactPhone: contact.contactPhone || '',
        contactRole: contact.contactRole || '',
        lastUpdated: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Always include contacts array if available (even if only one contact)
      // This ensures consistency and allows for easy addition of more contacts later
      if (contact.contacts && contact.contacts.length > 0) {
        contactData.contacts = contact.contacts;
      } else if (contact.contactPerson || contact.contactEmail || contact.contactPhone) {
        // If no contacts array but we have main contact, create one
        contactData.contacts = [{
          contactPerson: contact.contactPerson || '',
          contactEmail: contact.contactEmail || '',
          contactPhone: contact.contactPhone || '',
          contactRole: contact.contactRole || ''
        }];
      }

      console.log(`📊 Contact data for ${universityName}:`, contactData);
      console.log(`📊 Contacts array for ${universityName}:`, contactData.contacts);
      console.log(`📊 Contacts array length for ${universityName}:`, contactData.contacts?.length || 0);

      if (matchingDoc) {
        // Update existing university
        await updateDoc(matchingDoc.ref, contactData);
        updated++;
        console.log(`✅ Updated contact details for ${universityName} (ID: ${matchingDoc.id})`);
        console.log(`✅ Saved ${contactData.contacts?.length || 0} contacts for ${universityName}`);
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
          console.log(`✅ Saved ${contactData.contacts?.length || 0} contacts for ${universityName}`);
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
          console.log(`✅ Saved ${contactData.contacts?.length || 0} contacts for ${universityName}`);
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

