import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import User from '@/models/User';

// POST /api/customers/seed - Add sample customers with temperature data
export const POST = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();

    // Only allow Admin to seed data
    if (session.user.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get some employees to assign customers to
    const employees = await User.find({ 
      role: { $in: ['Employee', 'Manager'] },
      isActive: { $ne: false }
    }).select('_id name');

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No employees found to assign customers to' },
        { status: 400 }
      );
    }

    // Sample customers with temperature data
    const sampleCustomers = [
      {
        name: "John Smith",
        email: "john.smith@techcorp.com",
        phone: "+1-555-0123",
        company: "Tech Corp Inc",
        country: "United States",
        visaType: "H1B",
        status: "Customer",
        temperature: "hot",
        tags: ["enterprise", "high-priority", "tech"],
        notes: "Large enterprise client, very interested in our services",
        assignedTo: employees[0]._id,
        createdBy: session.user.id
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@innovate.com",
        phone: "+1-555-0124",
        company: "Innovation Labs",
        country: "Mexico",
        visaType: "TN",
        status: "Prospect",
        temperature: "warm",
        tags: ["startup", "ai", "follow-up"],
        notes: "AI startup founder, needs follow-up next week",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "David Chen",
        email: "david.chen@globalsol.com",
        phone: "+1-555-0125",
        company: "Global Solutions",
        country: "China",
        visaType: "L1",
        status: "Lead",
        temperature: "cold",
        tags: ["multinational", "consulting"],
        notes: "Initial contact made, waiting for response",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@healthplus.com",
        phone: "+1-555-0126",
        company: "Healthcare Plus",
        country: "Canada",
        visaType: "O1",
        status: "Customer",
        temperature: "hot",
        tags: ["healthcare", "priority", "recurring"],
        notes: "Excellent customer, expanding their team",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Ahmed Hassan",
        email: "ahmed.hassan@fintech.com",
        phone: "+1-555-0127",
        company: "Fintech Solutions",
        country: "Egypt",
        visaType: "H1B",
        status: "Prospect",
        temperature: "warm",
        tags: ["fintech", "blockchain"],
        notes: "Blockchain developer, interested in our platform",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Lisa Wang",
        email: "lisa.wang@ecommerce.com",
        phone: "+1-555-0128",
        company: "E-commerce Pro",
        country: "Singapore",
        visaType: "E2",
        status: "Lead",
        temperature: "warm",
        tags: ["ecommerce", "retail", "new"],
        notes: "E-commerce platform, just starting evaluation",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Carlos Rodriguez",
        email: "carlos.rodriguez@manufacturing.com",
        phone: "+1-555-0129",
        company: "Advanced Manufacturing",
        country: "Spain",
        visaType: "L1",
        status: "Inactive",
        temperature: "cold",
        tags: ["manufacturing", "industrial"],
        notes: "Lost touch, might re-engage later",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Priya Patel",
        email: "priya.patel@consulting.com",
        phone: "+1-555-0130",
        company: "Strategic Consulting",
        country: "India",
        visaType: "H1B",
        status: "Prospect",
        temperature: "hot",
        tags: ["consulting", "urgent", "decision-maker"],
        notes: "Decision maker, very urgent requirement",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Michael Brown",
        email: "michael.brown@startup.com",
        phone: "+1-555-0131",
        company: "Brown Startup",
        country: "United Kingdom",
        visaType: "O1",
        status: "Customer",
        temperature: "warm",
        tags: ["startup", "growing", "referral"],
        notes: "Growing startup, came through referral",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      },
      {
        name: "Anna Schmidt",
        email: "anna.schmidt@automation.de",
        phone: "+49-555-0132",
        company: "Automation Systems",
        country: "Germany",
        visaType: "L1",
        status: "Lead",
        temperature: "warm",
        tags: ["automation", "germany", "industrial"],
        notes: "German automation company, exploring US expansion",
        assignedTo: employees[Math.floor(Math.random() * employees.length)]._id,
        createdBy: session.user.id
      }
    ];

    // Insert sample customers
    const createdCustomers = await Customer.insertMany(sampleCustomers);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCustomers.length} sample customers with temperature data`,
      customers: createdCustomers.length
    });

  } catch (error) {
    console.error('Error seeding customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin']);
