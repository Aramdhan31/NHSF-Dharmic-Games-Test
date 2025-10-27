import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, checkDatabaseStatus } from '@/lib/initialize-database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database status...');
    
    const status = await checkDatabaseStatus();
    
    if (status.success && status.hasData) {
      return NextResponse.json({
        success: true,
        message: 'Database already initialized',
        count: status.count,
        action: 'none'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database needs initialization',
      count: 0,
      action: 'initialize'
    });
    
  } catch (error: any) {
    console.error('❌ Error checking database status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check database status',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing database...');
    
    const result = await initializeDatabase();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize database',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
