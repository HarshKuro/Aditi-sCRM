import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json(
        { message: 'Users already exist in the database' },
        { status: 200 }
      );
    }

    // Create initial users
    const users = [
      {
        name: 'System Administrator',
        email: 'admin@prospex.com',
        password: 'admin123',
        role: 'Admin',
        isActive: true,
      },
      {
        name: 'Sales Manager',
        email: 'manager@prospex.com',
        password: 'manager123',
        role: 'Manager',
        isActive: true,
      },
      {
        name: 'Sales Employee',
        email: 'employee@prospex.com',
        password: 'emp123',
        role: 'Employee',
        isActive: true,
      },
    ];

    const savedUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      savedUsers.push({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    return NextResponse.json(
      {
        message: 'Initial users created successfully',
        users: savedUsers,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Seed users error:', error);
    return NextResponse.json(
      { error: 'Failed to create initial users' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Seed users endpoint',
      usage: 'POST to create initial users',
      accounts: [
        { email: 'admin@prospex.com', password: 'admin123', role: 'Admin' },
        { email: 'manager@prospex.com', password: 'manager123', role: 'Manager' },
        { email: 'employee@prospex.com', password: 'emp123', role: 'Employee' },
      ],
    },
    { status: 200 }
  );
}
