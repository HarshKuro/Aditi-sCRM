import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    
    const users = await User.find({}).select('name email role isActive createdAt');
    
    return NextResponse.json({ 
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
