import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function DELETE() {
  try {
    await dbConnect();
    
    const result = await User.deleteMany({});
    
    return NextResponse.json({ 
      message: 'All users deleted',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Clear users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
