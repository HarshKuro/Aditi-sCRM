'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { withRoleAuth } from '@/lib/auth-guards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/shared/page-header';
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Download,
  Calendar,
  Thermometer,
  Globe,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface EmployeeStats {
  employee: Employee;
  totalCustomers: number;
  monthlyCustomers: number;
  statusBreakdown: Record<string, number>;
  temperatureBreakdown: {
    hot: number;
    warm: number;
    cold: number;
  };
  conversionRate: string;
}

interface MonthlyStats {
  month: string;
  total: number;
  leads: number;
  prospects: number;
  customers: number;
  inactive: number;
}

interface Distribution {
  name: string;
  value: number;
}

interface AnalyticsData {
  overview: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    activeCustomers: number;
    growthRate: number;
    conversionRate: string;
  };
  employeeStats: EmployeeStats[];
  topPerformers: EmployeeStats[];
  monthlyStats: MonthlyStats[];
  distributions: {
    status: Distribution[];
    country: Distribution[];
    visaType: Distribution[];
  };
  timeRange: string;
  lastUpdated: string;
}

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  orange: '#f97316'
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger, COLORS.purple, COLORS.pink];

function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [activeChart, setActiveChart] = useState<'line' | 'bar' | 'area'>('line');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
  };

  // Get temperature badge
  const getTemperatureBadge = (temp: 'hot' | 'warm' | 'cold', count: number) => {
    const variants = {
      hot: 'destructive',
      warm: 'default', 
      cold: 'secondary'
    } as const;
    
    const icons = {
      hot: '🔥',
      warm: '🌡️',
      cold: '❄️'
    };
    
    return (
      <Badge variant={variants[temp]} className="gap-1">
        <span>{icons[temp]}</span>
        {temp.charAt(0).toUpperCase() + temp.slice(1)}: {count}
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      Lead: 'secondary',
      Prospect: 'outline',
      Customer: 'default',
      Inactive: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  // Calculate percentage change
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
  };

  const handleExport = () => {
    if (!analytics) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analytics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "analytics-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Analytics Dashboard"
          description="Comprehensive business analytics and insights"
        />
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="Analytics Dashboard"
          description="Comprehensive business analytics and insights"
        />
        <Alert>
          <AlertDescription>Failed to load analytics data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Comprehensive business analytics and insights"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.newCustomersThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {((analytics.overview.activeCustomers / analytics.overview.totalCustomers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            {analytics.overview.growthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {analytics.overview.growthRate > 0 && '+'}
              {analytics.overview.growthRate}%
              {analytics.overview.growthRate >= 0 ? (
                <ChevronUp className="h-4 w-4 text-green-600 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 text-red-600 ml-1" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">lead to customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <LineChartIcon className="h-5 w-5" />
                  <span>Monthly Customer Trends</span>
                </CardTitle>
                <CardDescription>Customer acquisition and status over time</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={activeChart === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveChart('line')}
                >
                  Line
                </Button>
                <Button
                  variant={activeChart === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveChart('bar')}
                >
                  Bar
                </Button>
                <Button
                  variant={activeChart === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveChart('area')}
                >
                  Area
                </Button>
              </div>
            </div>
          </CardHeader>          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {activeChart === 'line' ? (
                <LineChart data={analytics.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={COLORS.secondary} strokeWidth={2} />
                  <Line type="monotone" dataKey="prospects" stroke={COLORS.accent} strokeWidth={2} />
                  <Line type="monotone" dataKey="customers" stroke={COLORS.primary} strokeWidth={2} />
                  <Line type="monotone" dataKey="inactive" stroke={COLORS.danger} strokeWidth={2} />
                </LineChart>
              ) : activeChart === 'bar' ? (
                <BarChart data={analytics.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill={COLORS.secondary} />
                  <Bar dataKey="prospects" fill={COLORS.accent} />
                  <Bar dataKey="customers" fill={COLORS.primary} />
                  <Bar dataKey="inactive" fill={COLORS.danger} />
                </BarChart>
              ) : (
                <AreaChart data={analytics.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke={COLORS.secondary} fill={COLORS.secondary} />
                  <Area type="monotone" dataKey="prospects" stackId="1" stroke={COLORS.accent} fill={COLORS.accent} />
                  <Area type="monotone" dataKey="customers" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} />
                  <Area type="monotone" dataKey="inactive" stackId="1" stroke={COLORS.danger} fill={COLORS.danger} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Customer Status Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown by customer status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.distributions.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.distributions.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Top Countries</span>
            </CardTitle>
            <CardDescription>Customer distribution by country</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.distributions.country.slice(0, 5)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Top Performers</span>
            </CardTitle>
            <CardDescription>Employees with most customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformers.map((performer, index) => (
                <div key={performer.employee._id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{performer.employee.name}</p>
                    <p className="text-sm text-muted-foreground">{performer.employee.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{performer.totalCustomers}</p>
                    <p className="text-sm text-muted-foreground">{performer.conversionRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Stats Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Employee Performance Details</span>
            </CardTitle>
            <CardDescription>Detailed breakdown of each employee's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">This Month</TableHead>
                    <TableHead className="text-center">Temperature</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : analytics.employeeStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.employeeStats.map((stat) => (
                      <TableRow key={stat.employee._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{stat.employee.name}</p>
                            <p className="text-sm text-muted-foreground">{stat.employee.role}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{stat.totalCustomers}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{stat.monthlyCustomers}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            {getTemperatureBadge('hot', stat.temperatureBreakdown.hot)}
                            {getTemperatureBadge('warm', stat.temperatureBreakdown.warm)}
                            {getTemperatureBadge('cold', stat.temperatureBreakdown.cold)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="font-medium">{stat.conversionRate}%</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visa Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Visa Type Distribution</span>
            </CardTitle>
            <CardDescription>Most common visa types</CardDescription>
          </CardHeader>
          <CardContent>            <div className="space-y-3">
              {analytics.distributions.visaType.slice(0, 5).map((item, index) => {
                const percentage = Math.min((item.value / (analytics.distributions.visaType[0]?.value || 1)) * 100, 100);
                const widthClass = percentage >= 75 ? 'w-full' : 
                                 percentage >= 50 ? 'w-3/4' : 
                                 percentage >= 25 ? 'w-1/2' : 'w-1/4';
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div className={`bg-blue-600 h-full rounded-full transition-all duration-300 ${widthClass}`} />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{item.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Insights</span>
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Average customers per employee</span>
                <span className="font-bold">
                  {analytics.employeeStats.length > 0 ? 
                    Math.round(analytics.overview.totalCustomers / analytics.employeeStats.length) : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Most active country</span>
                <span className="font-bold">
                  {analytics.distributions.country[0]?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Most common visa type</span>
                <span className="font-bold">
                  {analytics.distributions.visaType[0]?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Best performing employee</span>
                <span className="font-bold">
                  {analytics.topPerformers[0]?.employee.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Protect this page - Admin and Manager only
export default withRoleAuth(AdminAnalyticsPage, {
  allowedRoles: ['Admin', 'Manager'],
  redirectTo: '/unauthorized'
});
