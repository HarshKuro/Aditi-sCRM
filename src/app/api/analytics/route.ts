import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer, { ICustomer } from '@/models/Customer';
import User, { IUser } from '@/models/User';
import dbConnect from '@/lib/mongodb';
import Task, { ITask } from '@/models/Task';
import mongoose from 'mongoose';

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '6months'; // 1month, 3months, 6months, 1year
    const role = url.searchParams.get('role') || 'Employee';
    const status = url.searchParams.get('status');
    const employeeId = url.searchParams.get('employeeId');
    const dateRange = url.searchParams.get('dateRange') || 'thisMonth';
    
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

    // Get all active employees
    const employees = await User.find({ 
      role: { $in: ['Admin', 'Manager', 'Employee'] },
      isActive: { $ne: false }
    }).select('name email role');

    // Overall statistics
    const totalCustomers = await Customer.countDocuments();
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
    });
    const activeCustomers = await Customer.countDocuments({
      status: { $in: ['Prospect', 'Customer'] }
    });
    const leads = await Customer.countDocuments({ status: 'Lead' });
    const prospects = await Customer.countDocuments({ status: 'Prospect' });

    // Get status distribution
    const statusDistribution = await Customer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]) as Array<{ _id: string; count: number }>;

    // Get employee performance stats
    const employeeStats = await Customer.aggregate([
      {
        $group: {
          _id: '$assignedTo',
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Lead', 'Prospect', 'Customer']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]) as Array<{ _id: mongoose.Types.ObjectId; totalCustomers: number; activeCustomers: number }>;

    // Get employee details
    const employeeDetails = await User.find({
      _id: { $in: employeeStats.map(stat => stat._id) }
    }).select('name role') as IUser[];

    // Combine employee stats with details
    const employeeStatsWithDetails = employeeStats
      .map(stat => {
        const employee = employeeDetails.find(emp => emp._id.toString() === stat._id.toString());
        return {
          name: employee?.name || 'Unknown',
          role: employee?.role || 'Employee',
          totalCustomers: stat.totalCustomers,
          activeCustomers: stat.activeCustomers
        };
      })
      .filter(stat => stat.role !== 'Admin');

    // Monthly statistics for charts
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthlyData = await Customer.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const totalMonth = await Customer.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      monthlyStats.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        total: totalMonth,
        leads: monthlyData.find(d => d._id === 'Lead')?.count || 0,
        prospects: monthlyData.find(d => d._id === 'Prospect')?.count || 0,
        customers: monthlyData.find(d => d._id === 'Customer')?.count || 0,
        inactive: monthlyData.find(d => d._id === 'Inactive')?.count || 0
      });
    }

    // Country distribution
    const countryDistribution = await Customer.aggregate([
      { $match: { country: { $exists: true, $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Visa type distribution
    const visaTypeDistribution = await Customer.aggregate([
      { $match: { visaType: { $exists: true, $ne: '' } } },
      { $group: { _id: '$visaType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Performance metrics
    const topPerformers = employeeStatsWithDetails
      .sort((a, b) => b.totalCustomers - a.totalCustomers)
      .slice(0, 5);

    // Growth metrics
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthCustomers = await Customer.countDocuments({
      createdAt: { $gte: lastMonth, $lt: new Date(now.getFullYear(), now.getMonth(), 1) }
    });
    
    const growthRate = lastMonthCustomers > 0 ? 
      ((newCustomersThisMonth - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1) : '0';

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // Task stats
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ status: 'Pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });

    // Date range logic
    let startDateRange = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDateRange = now;
    if (dateRange === 'lastMonth') {
      startDateRange = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDateRange = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (dateRange === 'all') {
      startDateRange = new Date(2000, 0, 1);
    }

    // Build user query
    const userQuery: { role?: string; _id?: mongoose.Types.ObjectId } = { role };
    if (employeeId) userQuery._id = new mongoose.Types.ObjectId(employeeId);
    const users = await User.find(userQuery).select('name email role isActive');

    // For each user, get stats
    const userStats = await Promise.all(users.map(async (user) => {
      const customerQuery: { assignedTo: mongoose.Types.ObjectId; status?: string } = { 
        assignedTo: user._id 
      };
      if (status) customerQuery.status = status;
      // Total customers
      const totalCustomers = await Customer.countDocuments(customerQuery);
      // Status breakdown
      const leads = await Customer.countDocuments({ ...customerQuery, status: 'Lead' });
      const prospects = await Customer.countDocuments({ ...customerQuery, status: 'Prospect' });
      const customers = await Customer.countDocuments({ ...customerQuery, status: 'Customer' });
      const inactive = await Customer.countDocuments({ ...customerQuery, status: 'Inactive' });
      // Conversion rate
      const conversionRate = totalCustomers > 0 ? ((customers / totalCustomers) * 100).toFixed(1) : '0';
      // New customers this month
      const newCustomersThisMonth = await Customer.countDocuments({ ...customerQuery, createdAt: { $gte: startDateRange, $lte: endDateRange } });
      // Growth rate (compare to last month)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const newCustomersLastMonth = await Customer.countDocuments({ ...customerQuery, createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } });
      const growthRate = newCustomersLastMonth > 0 ? (((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100).toFixed(1) : '0';
      // Recent activity
      const recentActivity = await Customer.find({ ...customerQuery }).sort({ updatedAt: -1 }).limit(1).select('name updatedAt');
      return {
        user,
        totalCustomers,
        leads,
        prospects,
        customers,
        inactive,
        conversionRate,
        newCustomersThisMonth,
        growthRate,
        recentActivity: recentActivity[0] || null
      };
    }));

    // Get recent activity
    const recentActivity = await Promise.all([
      // Recent customer updates
      Customer.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('name status updatedAt')
        .then(customers => customers.map((customer: ICustomer) => ({
          type: 'customer',
          description: `Customer '${customer.name}' status updated to ${customer.status}`,
          timestamp: new Date(customer.updatedAt).toLocaleString(),
          icon: 'Users'
        }))),
      
      // Recent task updates
      Task.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title status updatedAt')
        .then(tasks => tasks.map((task: ITask) => ({
          type: 'task',
          description: `Task '${task.title}' status updated to ${task.status}`,
          timestamp: new Date(task.updatedAt).toLocaleString(),
          icon: 'ListChecks'
        })))
    ]).then(results => {
      // Combine and sort by timestamp
      const allActivities = results.flat();
      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Get only the 5 most recent activities
    });

    return NextResponse.json({
      overview: {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        growthRate: parseFloat(growthRate),
        conversionRate: totalCustomers > 0 ? 
          ((statusDistribution.find(s => s._id === 'Customer')?.count || 0) / totalCustomers * 100).toFixed(1) : '0'
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks
      },
      recentActivity,
      timeRange,
      lastUpdated: now.toISOString(),
      users: { total: totalUsers, active: activeUsers },
      customers: { total: totalCustomers, active: activeCustomers, leads, prospects },
      employeeStats: employeeStatsWithDetails,
      userStats,
      topPerformers,
      monthlyStats,
      statusDistribution,
      countryDistribution
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager']);
