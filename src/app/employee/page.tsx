import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Target, Clock } from 'lucide-react';

export default function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Your personal workspace and task overview"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </PageHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 due today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              5 hot prospects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Deals closed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <Badge variant="secondary">$</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <p className="text-xs text-muted-foreground">
              This month's earnings
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Your tasks for today and this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Follow up with ABC Corp</p>
                  <p className="text-sm text-muted-foreground">Due: Today 2:00 PM</p>
                </div>
                <Badge variant="destructive">High</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Prepare proposal for XYZ Ltd</p>
                  <p className="text-sm text-muted-foreground">Due: Tomorrow</p>
                </div>
                <Badge variant="secondary">Medium</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Call new lead - Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Due: Wednesday</p>
                </div>
                <Badge variant="outline">Low</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interactions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Deal closed</span> with Acme Inc
                <div className="text-muted-foreground text-xs">1 hour ago</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Email sent</span> to potential client
                <div className="text-muted-foreground text-xs">3 hours ago</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Meeting scheduled</span> with Tech Solutions
                <div className="text-muted-foreground text-xs">Yesterday</div>
              </div>
              <div className="text-sm">
                <span className="font-medium">Lead created</span> from website form
                <div className="text-muted-foreground text-xs">2 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
