import { NextRequest, NextResponse } from 'next/server';
import { realtimeDb } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Check if realtimeDb is initialized
    if (!realtimeDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Realtime Database not initialized',
        details: 'realtimeDb is null or undefined'
      }, { status: 500 });
    }

    // Check environment variables
    const envVars = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      databaseURL: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    console.log('🔍 Environment variables check:', envVars);
    console.log('🔍 Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);

    // Try to read from database
    const testRef = ref(realtimeDb, 'test');
    const snapshot = await get(testRef);
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection successful',
      envVars,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      snapshotExists: snapshot.exists()
    });
    
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Firebase connection failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
