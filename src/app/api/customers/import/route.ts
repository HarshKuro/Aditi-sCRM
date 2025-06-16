import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
import { nanoid } from 'nanoid';

interface ImportCustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  country?: string;
  visaType?: string;
  tags?: string[];
  assignedToId?: string;
  notes?: string;
}

interface ImportRequest {
  customers: ImportCustomerData[];
  importBatch?: string;
}

export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const body: ImportRequest = await request.json();
    const { customers, importBatch } = body;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid customer data. Must be a non-empty array.' },
        { status: 400 }
      );
    }

    // Get current user ID from session
    const currentUserId = session.user.id;
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'User session not found' },
        { status: 401 }
      );
    }

    // Generate unique import batch ID
    const batchId = importBatch || `import_${nanoid(10)}_${Date.now()}`;
    
    // Validate and prepare customer data
    const validatedCustomers = [];
    const errors = [];
    const skippedEmails = [];

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      
      // Basic validation
      if (!customer.name || customer.name.trim().length === 0) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }

      // Check if email already exists (if provided)
      if (customer.email) {
        const existingCustomer = await Customer.findOne({ 
          email: customer.email.toLowerCase() 
        });
        
        if (existingCustomer) {
          skippedEmails.push({
            row: i + 1,
            email: customer.email,
            reason: 'Email already exists'
          });
          continue;
        }
      }

      // Validate assigned user (if provided)
      let assignedToId = null;
      if (customer.assignedToId) {
        const assignedUser = await User.findById(customer.assignedToId);
        if (!assignedUser) {
          errors.push(`Row ${i + 1}: Assigned user not found`);
          continue;
        }
        assignedToId = customer.assignedToId;
      }

      // Prepare customer data
      const customerData = {
        name: customer.name.trim(),
        email: customer.email?.toLowerCase().trim(),
        phone: customer.phone?.trim(),
        company: customer.company?.trim(),
        country: customer.country?.trim(),
        visaType: customer.visaType?.trim(),
        tags: customer.tags || [],
        assignedTo: assignedToId,
        notes: customer.notes?.trim(),
        createdBy: currentUserId,
        importedAt: new Date(),
        importBatch: batchId,
        status: 'Lead' as const,
      };

      validatedCustomers.push(customerData);
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: errors,
        skipped: skippedEmails,
      }, { status: 400 });
    }

    // Insert customers in batch
    let savedCustomers = [];
    if (validatedCustomers.length > 0) {
      try {
        savedCustomers = await Customer.insertMany(validatedCustomers, {
          ordered: false, // Continue inserting even if some fail
        });
      } catch (insertError: any) {
        console.error('Batch insert error:', insertError);
        
        // Handle duplicate key errors and other issues
        if (insertError.writeErrors) {
          const insertErrors = insertError.writeErrors.map((err: any) => ({
            index: err.index,
            error: err.errmsg,
          }));
          
          return NextResponse.json({
            error: 'Some customers could not be imported',
            details: insertErrors,
            imported: insertError.result?.insertedCount || 0,
            skipped: skippedEmails,
          }, { status: 207 }); // 207 Multi-Status
        }
        
        throw insertError;
      }
    }

    // Update user's assignedCustomerIds for users who got new customers
    const userAssignments = new Map<string, number>();
    validatedCustomers.forEach(customer => {
      if (customer.assignedTo) {
        const count = userAssignments.get(customer.assignedTo) || 0;
        userAssignments.set(customer.assignedTo, count + 1);
      }
    });

    // Update users' assigned customer counts
    for (const [userId, count] of userAssignments) {
      await User.findByIdAndUpdate(userId, {
        $inc: { assignedCustomerCount: count }
      });
    }

    const response = {
      success: true,
      importBatch: batchId,
      imported: savedCustomers.length,
      skipped: skippedEmails.length,
      total: customers.length,
      details: {
        imported: savedCustomers.length,
        skipped: skippedEmails,
        errors: errors.length > 0 ? errors : undefined,
      }
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error importing customers:', error);
    return NextResponse.json(
      { error: 'Internal server error during import' },
      { status: 500 }
    );
  }
}, ['Admin']);
