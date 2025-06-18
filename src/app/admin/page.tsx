"use client";

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Manage your CRM system and monitor key metrics"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Badge variant="secondary">+12%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats?.users?.total ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              Active: {loading ? '...' : stats?.users?.active ?? '-'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Badge variant="secondary">+5%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats?.customers?.leads ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              Prospects: {loading ? '...' : stats?.customers?.prospects ?? '-'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Badge variant="secondary">+2%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats?.customers?.active ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              Total: {loading ? '...' : stats?.customers?.total ?? '-'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <Badge variant="secondary">+15%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats?.tasks?.total ?? '-'}</div>
            <p className="text-xs text-muted-foreground">
              Completed: {loading ? '...' : stats?.tasks?.completed ?? '-'} | Pending: {loading ? '...' : stats?.tasks?.pending ?? '-'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system health and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="outline" className="text-green-600">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Status</span>
                <Badge variant="outline" className="text-green-600">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <span className="text-sm text-muted-foreground">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest admin actions and system events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">John Doe</span> created a new user account
                <div className="text-muted-foreground text-xs">2 minutes ago</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Sarah Smith</span> updated system settings
                <div className="text-muted-foreground text-xs">15 minutes ago</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">System</span> completed scheduled backup
                <div className="text-muted-foreground text-xs">2 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
