import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import User from '@/models/User';
import { customerSchema } from '@/lib/excel-utils';

// GET /api/customers - Fetch customers
export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');    const country = searchParams.get('country') || '';
    const visaType = searchParams.get('visaType') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const temperature = searchParams.get('temperature') || '';

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (temperature) {
      query.temperature = temperature;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }
    
    if (visaType) {
      query.visaType = { $regex: visaType, $options: 'i' };
    }
    
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // If user is not admin, only show their assigned customers
    if (session.user.role !== 'Admin' && session.user.role !== 'Manager') {
      query.assignedTo = session.user.id;
    }

    const skip = (page - 1) * limit;    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    // Get filter options for admin/manager users
    let filters = {};
    if (session.user.role === 'Admin' || session.user.role === 'Manager') {      const [countries, visaTypes, employees] = await Promise.all([
        Customer.distinct('country', { country: { $exists: true, $ne: '' } }),
        Customer.distinct('visaType', { visaType: { $exists: true, $ne: '' } }),
        User.find({ role: { $in: ['Admin', 'Manager', 'Employee'] } })
          .select('name email role')
          .sort({ name: 1 })
      ]);
        filters = {
        countries: countries.sort(),
        visaTypes: visaTypes.sort(),
        employees,
        statuses: ['Lead', 'Prospect', 'Customer', 'Inactive'],
        temperatures: ['hot', 'warm', 'cold']
      };
    }

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
      filters
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);

// POST /api/customers - Create customer
export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();

    const body = await request.json();
    
    // Validate data
    const validatedData = customerSchema.parse(body);

    const customer = new Customer({
      ...validatedData,
      createdBy: session.user.id,
      assignedTo: body.assignedTo || session.user.id,
    });

    await customer.save();
    
    await customer.populate('assignedTo', 'name email role');
    await customer.populate('createdBy', 'name email');

    return NextResponse.json(customer, { status: 201 });

  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);
