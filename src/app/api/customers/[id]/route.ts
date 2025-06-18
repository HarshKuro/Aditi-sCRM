import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

// GET /api/customers/[id] - Get customer by ID
export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }, session: any) => {
  try {
    await dbConnect();

    const customer = await Customer.findById(params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this customer
    if (session.user.role !== 'Admin' && session.user.role !== 'Manager' && 
        customer.assignedTo?._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);

// PATCH /api/customers/[id] - Update customer
export const PATCH = withAuth(async (request: NextRequest, { params }: { params: { id: string } }, session: any) => {
  try {
    await dbConnect();

    const data = await request.json();
    const customer = await Customer.findById(params.id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if user has access to update this customer
    if (session.user.role !== 'Admin' && session.user.role !== 'Manager' && 
        customer.assignedTo?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update customer
    Object.assign(customer, {
      ...data,
      lastUpdatedBy: session.user.id
    });

    await customer.save();

    // Fetch updated customer with populated references
    const updatedCustomer = await Customer.findById(customer._id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
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

// DELETE /api/customers/[id] - Delete customer
export const DELETE = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    // Get the ID from the URL
    const id = request.url.split('/').pop();

    // Check if user is admin
    if (!session?.user?.role || session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete customers' },
        { status: 403 }
      );
    }

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin']);
