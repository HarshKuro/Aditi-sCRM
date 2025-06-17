"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { DollarSign, Users, ListChecks, BarChart3, Activity, TrendingUp } from "lucide-react";
import { mockCustomers, mockTasks, mockSales } from "@/lib/mock-data";
import Image from "next/image";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    window.location.href = '/login';
    return null;
  }
  
  const user = session?.user;

  const totalCustomers = mockCustomers.length;
  const activeTasks = mockTasks.filter(task => task.status !== 'Completed').length;
  const totalSalesValue = mockSales.reduce((sum, sale) => sum + sale.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const openDeals = mockSales.filter(sale => sale.stage !== 'Closed Won' && sale.stage !== 'Closed Lost').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}!`}
        description={user?.role === 'Admin' ? "Oversee all CRM activities." : "Here's an overview of your activities."}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Customers" value={String(totalCustomers)} icon={Users} description="+5 this month" />
        <MetricCard title="Active Tasks" value={String(activeTasks)} icon={ListChecks} description="3 overdue" />
        <MetricCard title="Pipeline Value" value={totalSalesValue} icon={DollarSign} description="Total value of open deals" />
        <MetricCard title="Open Deals" value={String(openDeals)} icon={BarChart3} description="Across all stages" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Users, text: "New customer 'Innovate LLC' added.", time: "2 hours ago", color: "text-green-500" },
              { icon: ListChecks, text: "Task 'Follow up with Alpha Corp' marked complete.", time: "5 hours ago", color: "text-blue-500" },
              { icon: TrendingUp, text: "Deal 'Project Phoenix' moved to Proposal stage.", time: "1 day ago", color: "text-purple-500" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                  <activity.icon className="h-5 w-5 text-background" />
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">View All Activity</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline Overview</CardTitle>
            <CardDescription>Snapshot of your current sales funnel.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for a mini sales pipeline chart or summary */}
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Sales Pipeline Chart Placeholder" 
              width={600} 
              height={300} 
              className="rounded-md object-cover"
              data-ai-hint="sales chart" 
            />
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Visual summary of deals in Qualification, Proposal, and Negotiation stages.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
