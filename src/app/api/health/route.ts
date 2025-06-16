import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ 
      message: 'Database connected successfully',
      status: 'healthy' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        message: 'Database connection failed',
        status: 'error' 
      },
      { status: 500 }
    );
  }
}
