import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import User from '@/models/User';
import { customerSchema } from '@/lib/excel-utils';

// GET /api/customers - Fetch customers with filters
export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const visaType = searchParams.get('visaType');
    const assignedTo = searchParams.get('assignedTo');
    const temperature = searchParams.get('temperature');
    const tag = searchParams.get('tag');

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    if (country) {
      query.country = country;
    }
    
    if (visaType) {
      query.visaType = visaType;
    }
    
    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedTo;
      }
    }

    if (temperature) {
      query.temperature = temperature;
    }

    if (tag) {
      query.tags = tag;
    }

    // If user is not admin, only show their assigned customers
    if (session.user.role !== 'Admin' && session.user.role !== 'Manager') {
      query.assignedTo = session.user.id;
    }

    const skip = (page - 1) * limit;

    // Fetch customers with populated references and pagination
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    // Get filter options
    const [countries, visaTypes] = await Promise.all([
      Customer.distinct('country', { country: { $exists: true, $ne: '' } }),
      Customer.distinct('visaType', { visaType: { $exists: true, $ne: '' } }),
    ]);

    // Get stats for each status
    const baseQuery = session.user.role !== 'Admin' && session.user.role !== 'Manager' 
      ? { assignedTo: session.user.id } 
      : {};

    const stats = await Customer.aggregate([
      { 
        $match: baseQuery
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).exec();

    // Initialize counts with 0
    const statusCounts = {
      Lead: 0,
      Prospect: 0,
      Customer: 0,
      Inactive: 0
    };

    // Update counts from aggregation results
    stats.forEach(({ _id, count }) => {
      if (_id && _id in statusCounts) {
        statusCounts[_id] = count;
      }
    });

    // Double check the total count
    const totalCount = await Customer.countDocuments(baseQuery);
    
    console.log('Status counts:', statusCounts);
    console.log('Total count:', totalCount);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      filters: {
        countries: countries.sort(),
        visaTypes: visaTypes.sort(),
        statuses: ['Lead', 'Prospect', 'Customer', 'Inactive']
      },
      stats: statusCounts
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);

// POST /api/customers - Create new customer
export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    // Create new customer with user info
    const newCustomer = new Customer({
      ...data,
      createdBy: session.user.id,
      lastUpdatedBy: session.user.id,
      assignedTo: session.user.id,
    });

    // Save to database
    await newCustomer.save();

    // Fetch the saved customer with populated references
    const savedCustomer = await Customer.findById(newCustomer._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    return NextResponse.json(savedCustomer, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
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
