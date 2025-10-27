"use client";

import { realtimeDb } from './firebase';
import { ref, set, get } from 'firebase/database';

// University data from the teams page
const allUKUniversities = [
  // ===== NORTH & CENTRAL ZONE (NZ+CZ) - Nov 22, 2025 =====
  { name: "Aston", zone: "NZ+CZ", abbreviation: "AST" },
  { name: "Birmingham", zone: "NZ+CZ", abbreviation: "BIR" },
  { name: "Cambridge", zone: "NZ+CZ", abbreviation: "CAM" },
  { name: "Coventry", zone: "NZ+CZ", abbreviation: "COV" },
  { name: "DMU", zone: "NZ+CZ", abbreviation: "DMU" },
  { name: "Dundee", zone: "NZ+CZ", abbreviation: "DUN" },
  { name: "East Anglia", zone: "NZ+CZ", abbreviation: "UEA" },
  { name: "Edinburgh", zone: "NZ+CZ", abbreviation: "EDI" },
  { name: "Keele", zone: "NZ+CZ", abbreviation: "KEE" },
  { name: "Lancaster", zone: "NZ+CZ", abbreviation: "LAN" },
  { name: "Leeds", zone: "NZ+CZ", abbreviation: "LEE" },
  { name: "Leicester", zone: "NZ+CZ", abbreviation: "LEI" },
  { name: "Loughborough", zone: "NZ+CZ", abbreviation: "LBO" },
  { name: "Manchester", zone: "NZ+CZ", abbreviation: "MAN" },
  { name: "Northampton", zone: "NZ+CZ", abbreviation: "NOR" },
  { name: "Nottingham", zone: "NZ+CZ", abbreviation: "NOT" },
  { name: "Nottingham Trent", zone: "NZ+CZ", abbreviation: "NTU" },
  { name: "Sheffield", zone: "NZ+CZ", abbreviation: "SHE" },
  { name: "UCLAN", zone: "NZ+CZ", abbreviation: "UCL" },
  { name: "Warwick", zone: "NZ+CZ", abbreviation: "WAR" },
  { name: "York", zone: "NZ+CZ", abbreviation: "YOR" },

  // ===== LONDON & SOUTH ZONE (LZ+SZ) - Nov 23, 2025 =====
  { name: "ARU", zone: "LZ+SZ", abbreviation: "ARU" },
  { name: "Bristol", zone: "LZ+SZ", abbreviation: "BRI" },
  { name: "Brunel", zone: "LZ+SZ", abbreviation: "BRU" },
  { name: "Cardiff", zone: "LZ+SZ", abbreviation: "CAR" },
  { name: "City", zone: "LZ+SZ", abbreviation: "CIT" },
  { name: "East London", zone: "LZ+SZ", abbreviation: "EL" },
  { name: "Essex", zone: "LZ+SZ", abbreviation: "ESS" },
  { name: "Exeter", zone: "LZ+SZ", abbreviation: "EXE" },
  { name: "Greenwich", zone: "LZ+SZ", abbreviation: "GRE" },
  { name: "Hertfordshire", zone: "LZ+SZ", abbreviation: "HER" },
  { name: "Imperial", zone: "LZ+SZ", abbreviation: "IMP" },
  { name: "KCL", zone: "LZ+SZ", abbreviation: "KCL" },
  { name: "LSE", zone: "LZ+SZ", abbreviation: "LSE" },
  { name: "Oxford", zone: "LZ+SZ", abbreviation: "OXF" },
  { name: "Oxford Brookes", zone: "LZ+SZ", abbreviation: "OXB" },
  { name: "Plymouth", zone: "LZ+SZ", abbreviation: "PLY" },
  { name: "Portsmouth", zone: "LZ+SZ", abbreviation: "POR" },
  { name: "QMUL", zone: "LZ+SZ", abbreviation: "QML" },
  { name: "Royal Holloway", zone: "LZ+SZ", abbreviation: "RHU" },
  { name: "St George's", zone: "LZ+SZ", abbreviation: "STG" },
  { name: "Swansea", zone: "LZ+SZ", abbreviation: "SWA" },
  { name: "UCL", zone: "LZ+SZ", abbreviation: "UCL" },
  { name: "Westminster", zone: "LZ+SZ", abbreviation: "WES" }
];

export const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing Firebase Realtime Database with university data...');
    
    if (!realtimeDb) {
      throw new Error('Firebase Realtime Database not initialized');
    }

    console.log('🔍 Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
    console.log('🔍 Realtime DB instance:', realtimeDb);

    // Create university data structure
    const universitiesData: { [key: string]: any } = {};
    
    allUKUniversities.forEach((uni, index) => {
      const id = `uni_${index + 1}`;
      universitiesData[id] = {
        id,
        name: uni.name,
        abbreviation: uni.abbreviation,
        zone: uni.zone,
        email: `${uni.abbreviation.toLowerCase()}@nhsf-dharmic-games.com`,
        contactPerson: `${uni.name} Sports Secretary`,
        checkedIn: false,
        isActive: true,
        isCompeting: true,
        sports: [],
        players: {},
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };
    });

    // Save to Firebase Realtime Database
    const universitiesRef = ref(realtimeDb, 'universities');
    await set(universitiesRef, universitiesData);
    
    console.log('✅ Successfully initialized database with', allUKUniversities.length, 'universities');
    
    return {
      success: true,
      message: `Database initialized with ${allUKUniversities.length} universities`,
      count: allUKUniversities.length
    };
    
  } catch (error: any) {
    console.error('❌ Error initializing database:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const checkDatabaseStatus = async () => {
  try {
    if (!realtimeDb) {
      return { success: false, error: 'Database not initialized' };
    }

    console.log('🔍 Checking database status...');
    console.log('🔍 Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
    
    const universitiesRef = ref(realtimeDb, 'universities');
    console.log('🔍 Universities ref:', universitiesRef);
    
    const snapshot = await get(universitiesRef);
    console.log('🔍 Snapshot exists:', snapshot.exists());
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const count = Object.keys(data).length;
      return {
        success: true,
        hasData: true,
        count,
        message: `Database contains ${count} universities`
      };
    } else {
      return {
        success: true,
        hasData: false,
        count: 0,
        message: 'Database is empty'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};
