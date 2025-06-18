import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import dbConnect from '@/lib/mongodb';

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '6months'; // 1month, 3months, 6months, 1year
    const employeeId = session.user.id; // Get performance for current user
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // Get all customers assigned to this employee
    const totalCustomers = await Customer.countDocuments({
      assignedTo: employeeId
    });

    // Get customers created in the time range
    const newCustomersInRange = await Customer.countDocuments({
      assignedTo: employeeId,
      createdAt: { $gte: startDate }
    });

    // Get customers created this month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = await Customer.countDocuments({
      assignedTo: employeeId,
      createdAt: { $gte: thisMonthStart }
    });

    // Get customers created last month for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const newCustomersLastMonth = await Customer.countDocuments({
      assignedTo: employeeId,
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Status breakdown
    const statusBreakdown = await Customer.aggregate([
      { $match: { assignedTo: employeeId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Temperature breakdown
    const temperatureBreakdown = await Customer.aggregate([
      { $match: { assignedTo: employeeId } },
      { $group: { _id: '$temperature', count: { $sum: 1 } } }
    ]);

    // Conversion metrics
    const totalLeads = await Customer.countDocuments({
      assignedTo: employeeId,
      status: 'Lead'
    });

    const totalProspects = await Customer.countDocuments({
      assignedTo: employeeId,
      status: 'Prospect'
    });

    const totalCustomersConverted = await Customer.countDocuments({
      assignedTo: employeeId,
      status: 'Customer'
    });

    const totalInactive = await Customer.countDocuments({
      assignedTo: employeeId,
      status: 'Inactive'
    });

    // Monthly performance over time
    const monthlyPerformance = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthlyCustomers = await Customer.countDocuments({
        assignedTo: employeeId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthlyConversions = await Customer.countDocuments({
        assignedTo: employeeId,
        status: 'Customer',
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      });

      monthlyPerformance.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        newCustomers: monthlyCustomers,
        conversions: monthlyConversions,
        conversionRate: monthlyCustomers > 0 ? ((monthlyConversions / monthlyCustomers) * 100).toFixed(1) : '0'
      });
    }

    // Recent activity - customers updated in last 7 days
    const recentActivityDate = new Date();
    recentActivityDate.setDate(recentActivityDate.getDate() - 7);
    
    const recentActivity = await Customer.find({
      assignedTo: employeeId,
      updatedAt: { $gte: recentActivityDate }
    })
      .select('name company status temperature updatedAt')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Top performing customers (by temperature and status)
    const hotCustomers = await Customer.countDocuments({
      assignedTo: employeeId,
      temperature: 'hot'
    });

    const warmCustomers = await Customer.countDocuments({
      assignedTo: employeeId,
      temperature: 'warm'
    });

    const coldCustomers = await Customer.countDocuments({
      assignedTo: employeeId,
      temperature: 'cold'
    });

    // Calculate conversion rate
    const conversionRate = totalCustomers > 0 ? 
      ((totalCustomersConverted / totalCustomers) * 100).toFixed(1) : '0';

    // Calculate growth rate
    const growthRate = newCustomersLastMonth > 0 ? 
      (((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100).toFixed(1) : '0';

    // Performance goals (you can make these configurable)
    const monthlyGoal = 10; // Target new customers per month
    const conversionGoal = 25; // Target conversion rate percentage

    return NextResponse.json({
      employee: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role
      },
      overview: {
        totalCustomers,
        newCustomersThisMonth,
        newCustomersLastMonth,
        growthRate: parseFloat(growthRate),
        conversionRate: parseFloat(conversionRate),
        newCustomersInRange
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {
        Lead: 0,
        Prospect: 0,
        Customer: 0,
        Inactive: 0
      }),
      temperatureBreakdown: {
        hot: hotCustomers,
        warm: warmCustomers,
        cold: coldCustomers
      },
      monthlyPerformance,
      recentActivity,
      goals: {
        monthlyGoal,
        conversionGoal,
        monthlyProgress: (newCustomersThisMonth / monthlyGoal * 100).toFixed(1),
        conversionProgress: (parseFloat(conversionRate) / conversionGoal * 100).toFixed(1)
      },
      timeRange,
      lastUpdated: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching employee analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager', 'Employee']);
