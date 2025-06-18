"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, ListChecks, BarChart3, Activity, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  colorClass?: string;
}

function MetricCard({ title, value, icon: Icon, description, colorClass = "text-primary" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  overview: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    activeCustomers: number;
    growthRate: number;
    conversionRate: string;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    icon: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);
  
  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading Dashboard..."
          description="Please wait while we fetch your data."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-4 w-[120px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Error Loading Dashboard"
          description={error}
        />
      </div>
    );
  }
  
  const user = session?.user;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}!`}
        description={user?.role === 'Admin' ? "Oversee all CRM activities." : "Here's an overview of your activities."}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Customers" 
          value={String(dashboardData?.overview?.totalCustomers || 0)} 
          icon={Users} 
          description={`+${dashboardData?.overview?.newCustomersThisMonth || 0} this month`} 
        />
        <MetricCard 
          title="Active Tasks" 
          value={String((dashboardData?.tasks?.pending || 0) + (dashboardData?.tasks?.inProgress || 0))} 
          icon={ListChecks} 
          description={`${dashboardData?.tasks?.completed || 0} completed`} 
        />
        <MetricCard 
          title="Active Customers" 
          value={String(dashboardData?.overview?.activeCustomers || 0)} 
          icon={Users} 
          description={`${dashboardData?.overview?.growthRate || 0}% growth`} 
        />
        <MetricCard 
          title="Conversion Rate" 
          value={`${dashboardData?.overview?.conversionRate || 0}%`} 
          icon={BarChart3} 
          description="Lead to customer conversion" 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-muted ${activity.icon === 'Users' ? 'text-green-500' : activity.icon === 'ListChecks' ? 'text-blue-500' : 'text-purple-500'}`}>
                  {activity.icon === 'Users' && <Users className="h-5 w-5 text-background" />}
                  {activity.icon === 'ListChecks' && <ListChecks className="h-5 w-5 text-background" />}
                  {activity.icon === 'TrendingUp' && <TrendingUp className="h-5 w-5 text-background" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">View All Activity</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Your key performance metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Task Completion Rate</span>
                <span className="font-bold">
                  {dashboardData?.tasks?.total ? 
                    Math.round((dashboardData.tasks.completed / dashboardData.tasks.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Growth</span>
                <span className="font-bold">{dashboardData?.overview?.growthRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Customers</span>
                <span className="font-bold">{dashboardData?.overview?.activeCustomers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-bold">{dashboardData?.overview?.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
