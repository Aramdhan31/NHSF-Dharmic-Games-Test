import { NextRequest, NextResponse } from 'next/server';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { universities as staticUniversities } from '@/app/teams/page';

export async function GET(request: NextRequest) {
  try {
    const col = collection(db, "universities");

    // Get all universities from static data
    const allUniversities = staticUniversities;

    for (const staticUni of allUniversities) {
      const name = staticUni.name;
      const zone = staticUni.zone;
      const date = zone === "NZ+CZ" ? "2025-11-22" : "2025-11-23";

      // Pre-populate sports and teamInfo for LZ+SZ from static data
      const sports = staticUni.sports || [];
      const teamInfo = staticUni.teamInfo || {};
      const isCompeting = staticUni.isCompeting || false;

      await setDoc(doc(col, `uni-${name.toLowerCase().replace(/[^a-z]/g, "")}`), {
        name,
        zone,
        date,
        status: isCompeting ? "competing" : "affiliated",
        sports: sports, // Pre-populated for LZ+SZ
        teamInfo: teamInfo, // Pre-populated for LZ+SZ with Team A/B info
        members: 0,
        wins: 0,
        losses: 0,
        points: 0,
        isCompeting: isCompeting,
        description: staticUni.description || `${name} Hindu Society`,
        tournamentDate: staticUni.tournamentDate || date,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "✅ Universities added successfully",
      count: allUniversities.length
    });
  } catch (error: any) {
    console.error("Error adding universities:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to add universities: " + error.message 
    }, { status: 500 });
  }
}