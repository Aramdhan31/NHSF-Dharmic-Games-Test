import { NextRequest, NextResponse } from 'next/server';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const universities = [
  // --- North & Central Zone (NZ+CZ)
  "Aston", "Birmingham", "Cambridge", "Coventry", "DMU",
  "Dundee", "East Anglia", "Edinburgh", "Keele", "Lancaster",
  "Leeds", "Leicester", "Loughborough", "Manchester", "Northampton",
  "Nottingham", "Nottingham Trent", "Sheffield", "UCLAN", "Warwick",
  "York", "Derby",
  // --- London & South Zone (LZ+SZ)
  "ARU", "Bristol", "Brunel", "Cardiff", "City",
  "East London", "Essex", "Exeter", "Greenwich", "Hertfordshire",
  "Imperial", "KCL", "LSE", "Oxford",
  "Oxford Brookes", "Plymouth", "Portsmouth", "QMUL",
  "Royal Holloway", "St George's", "Swansea", "UCL", "Westminster",
  "Reading"
];

export async function GET(request: NextRequest) {
  try {
    const col = collection(db, "universities");

    for (const name of universities) {
      const zone = [
        "Aston","Birmingham","Cambridge","Coventry","DMU",
        "Dundee","East Anglia","Edinburgh","Keele","Lancaster",
        "Leeds","Leicester","Loughborough","Manchester","Northampton",
        "Nottingham","Nottingham Trent","Sheffield","UCLAN","Warwick",
        "York","Derby"
      ].includes(name)
        ? "NZ+CZ"
        : "LZ+SZ";

      const date = zone === "NZ+CZ" ? "2025-11-22" : "2025-11-23";

      await setDoc(doc(col, `uni-${name.toLowerCase().replace(/[^a-z]/g, "")}`), {
        name,
        zone,
        date,
        status: "affiliated",
        sports: [],
        members: 0,
        wins: 0,
        losses: 0,
        points: 0,
        isCompeting: false,
        description: `${name} Hindu Society`,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "✅ Universities added successfully",
      count: universities.length
    });
  } catch (error: any) {
    console.error("Error adding universities:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to add universities: " + error.message 
    }, { status: 500 });
  }
}