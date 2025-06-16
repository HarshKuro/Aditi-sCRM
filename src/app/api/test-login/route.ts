import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    await dbConnect();
    
    console.log('Testing login for:', email);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', { 
      id: user._id, 
      email: user.email, 
      name: user.name, 
      role: user.role, 
      isActive: user.isActive 
    });
    
    if (!user.isActive) {
      console.log('User is not active');
      return NextResponse.json({ error: 'User is not active' }, { status: 403 });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
