"use client";

import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, PieChart, Users, ListChecks, DollarSign, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default function ReportsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'Admin') {
      router.replace('/dashboard'); // Redirect non-admins
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'Admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <AlertTriangle className="h-10 w-10 text-destructive mr-2" /> 
        <p className="text-xl">Access Denied or Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Key metrics and insights for your CRM data.">
        <Select defaultValue="month">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Customer Status Distribution</CardTitle>
            <CardDescription>Breakdown of customers by their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image src="https://placehold.co/400x250.png" alt="Customer Status Chart" width={400} height={250} className="rounded-md object-cover" data-ai-hint="pie chart" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /> Task Completion Rates</CardTitle>
            <CardDescription>Overview of task statuses and completion trends.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image src="https://placehold.co/400x250.png" alt="Task Completion Chart" width={400} height={250} className="rounded-md object-cover" data-ai-hint="bar chart" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" /> Sales Pipeline Value by Stage</CardTitle>
            <CardDescription>Total value of opportunities in each sales stage.</CardDescription>
          </CardHeader>
          <CardContent>
             <Image src="https://placehold.co/400x250.png" alt="Sales Pipeline Value Chart" width={400} height={250} className="rounded-md object-cover" data-ai-hint="funnel chart" />
          </CardContent>
        </Card>
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5 text-primary" /> Overall Sales Performance</CardTitle>
            <CardDescription>Track sales trends over the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
             <Image src="https://placehold.co/800x300.png" alt="Overall Sales Performance Chart" width={800} height={300} className="rounded-md object-cover w-full" data-ai-hint="line graph finance" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
