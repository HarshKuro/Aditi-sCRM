import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/mongodb';

export const PATCH = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    // Extract customer ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const customerId = pathParts[pathParts.length - 2]; // Get ID before '/status'
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, temperature, notes, tags } = body;
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this customer
    // Employees can only update their assigned customers
    // Admins and Managers can update any customer
    if (session.user.role === 'Employee' && customer.assignedTo?.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update customers assigned to you' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status !== undefined) {
      // Validate status values
      const validStatuses = ['Lead', 'Prospect', 'Customer', 'Inactive'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: Lead, Prospect, Customer, Inactive' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (temperature !== undefined) {
      // Validate temperature values
      const validTemperatures = ['hot', 'warm', 'cold'];
      if (!validTemperatures.includes(temperature)) {
        return NextResponse.json(
          { error: 'Invalid temperature. Must be one of: hot, warm, cold' },
          { status: 400 }
        );
      }
      updateData.temperature = temperature;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (tags !== undefined) {
      // Ensure tags is an array
      if (Array.isArray(tags)) {
        updateData.tags = tags;
      } else if (typeof tags === 'string') {
        updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    // Add last updated info
    updateData.updatedAt = new Date();
    updateData.lastUpdatedBy = session.user.id;

    // Update the customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Error updating customer status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);
