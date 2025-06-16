import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export const PATCH = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    // Extract customer ID from URL
    const url = new URL(request.url);
    const customerId = url.pathname.split('/').pop();
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this customer
    if (session.user.role !== 'Admin' && session.user.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update fields
    const updateData: any = {};
    
    if (body.assignedTo !== undefined) {
      // Validate the assigned user exists
      if (body.assignedTo) {
        const assignedUser = await User.findById(body.assignedTo);
        if (!assignedUser) {
          return NextResponse.json(
            { error: 'Assigned user not found' },
            { status: 400 }
          );
        }
      }
      updateData.assignedTo = body.assignedTo;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.tags !== undefined) {
      updateData.tags = body.tags;
    }

    if (body.country !== undefined) {
      updateData.country = body.country;
    }

    if (body.visaType !== undefined) {
      updateData.visaType = body.visaType;
    }

    // Update the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email');

    return NextResponse.json(updatedCustomer);

  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager']);

export const DELETE = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    // Extract customer ID from URL
    const url = new URL(request.url);
    const customerId = url.pathname.split('/').pop();
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Only admins can delete customers
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await Customer.findByIdAndDelete(customerId);

    return NextResponse.json({ message: 'Customer deleted successfully' });

  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin']);
