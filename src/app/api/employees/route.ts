import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// Export with admin-only protection
export const GET = withAuth(async (request: NextRequest) => {
  try {
    await dbConnect();
      const employees = await User.find({})
      .select('name email role assignedCustomerIds isActive lastLogin createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['Admin']);

export const POST = withAuth(async (request: NextRequest) => {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password, role, assignedCustomerIds = [] } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be Admin, Manager, or Employee' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee
    const newEmployee = new User({
      name,
      email,
      password: hashedPassword,
      role,
      assignedCustomerIds,
      isActive: true,
    });

    await newEmployee.save();

    // Return employee without password
    const employeeResponse = {
      id: newEmployee._id,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      assignedCustomerIds: newEmployee.assignedCustomerIds,
      isActive: newEmployee.isActive,
      createdAt: newEmployee.createdAt,
    };

    return NextResponse.json({ 
      message: 'Employee created successfully',
      employee: employeeResponse 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['Admin']);
