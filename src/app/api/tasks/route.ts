import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Task from '@/models/Task';
import dbConnect from '@/lib/mongodb';

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {};

    // Add status filter if provided
    if (status && status !== 'All') {
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add customer filter if provided
    if (customerId) {
      query.customerId = customerId;
    }

    // Add user role-based filtering
    if (session.user.role !== 'Admin') {
      query.assignedEmployeeId = session.user.id;
    }

    const skip = (page - 1) * limit;

    // Fetch tasks with populated references and pagination
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('customerId', 'name')
        .populate('assignedEmployeeId', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);

export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // Create new task with user info
    const newTask = new Task({
      ...data,
      createdBy: session.user.id,
      lastUpdatedBy: session.user.id,
      // Convert string IDs to ObjectIds if needed
      customerId: data.customerId || null,
      assignedEmployeeId: data.assignedEmployeeId || session.user.id,
    });

    // Save to database
    await newTask.save();

    // Fetch the saved task with populated references
    const savedTask = await Task.findById(newTask._id)
      .populate('customerId', 'name')
      .populate('assignedEmployeeId', 'name')
      .populate('createdBy', 'name');

    return NextResponse.json(savedTask, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']); 