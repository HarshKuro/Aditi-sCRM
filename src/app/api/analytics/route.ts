import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-utils';
import Customer from '@/models/Customer';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export const GET = withAuth(async (request: NextRequest, session: any) => {
  try {
    await dbConnect();
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '6months'; // 1month, 3months, 6months, 1year
    
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

    // Employee performance analytics
    const employeeStats = await Promise.all(
      employees.map(async (employee) => {
        const totalAssigned = await Customer.countDocuments({
          assignedTo: employee._id
        });
        
        const statusBreakdown = await Customer.aggregate([
          { $match: { assignedTo: employee._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        
        const monthlyCustomers = await Customer.countDocuments({
          assignedTo: employee._id,
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) }
        });

        // Simulate temperature for demo (in real app, this would be based on actual data)
        const temperatureBreakdown = {
          hot: Math.floor(totalAssigned * 0.2),
          warm: Math.floor(totalAssigned * 0.5),
          cold: Math.floor(totalAssigned * 0.3)
        };
        
        return {
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            role: employee.role
          },
          totalCustomers: totalAssigned,
          monthlyCustomers,
          statusBreakdown: statusBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          temperatureBreakdown,
          conversionRate: totalAssigned > 0 ? 
            ((statusBreakdown.find(s => s._id === 'Customer')?.count || 0) / totalAssigned * 100).toFixed(1) : '0'
        };
      })
    );

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

    // Status distribution for pie chart
    const statusDistribution = await Customer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

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
    const topPerformers = employeeStats
      .sort((a, b) => b.totalCustomers - a.totalCustomers)
      .slice(0, 5);

    // Growth metrics
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthCustomers = await Customer.countDocuments({
      createdAt: { $gte: lastMonth, $lt: new Date(now.getFullYear(), now.getMonth(), 1) }
    });
    
    const growthRate = lastMonthCustomers > 0 ? 
      ((newCustomersThisMonth - lastMonthCustomers) / lastMonthCustomers * 100).toFixed(1) : '0';

    return NextResponse.json({
      overview: {
        totalCustomers,
        newCustomersThisMonth,
        activeCustomers,
        growthRate: parseFloat(growthRate),
        conversionRate: totalCustomers > 0 ? 
          ((statusDistribution.find(s => s._id === 'Customer')?.count || 0) / totalCustomers * 100).toFixed(1) : '0'
      },
      employeeStats,
      topPerformers,
      monthlyStats,
      distributions: {
        status: statusDistribution.map(item => ({
          name: item._id,
          value: item.count
        })),
        country: countryDistribution.map(item => ({
          name: item._id,
          value: item.count
        })),
        visaType: visaTypeDistribution.map(item => ({
          name: item._id,
          value: item.count
        }))
      },
      timeRange,
      lastUpdated: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, ['Admin', 'Manager']);
