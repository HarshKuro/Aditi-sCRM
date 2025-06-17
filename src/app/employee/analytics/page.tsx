'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { withRoleAuth } from '@/lib/auth-guards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/shared/page-header';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Award,
  RefreshCw,
  Calendar,
  Thermometer,
  ChevronUp,
  ChevronDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PerformanceInsights } from '@/components/employee/performance-insights';

interface EmployeeAnalytics {
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  overview: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    newCustomersLastMonth: number;
    growthRate: number;
    conversionRate: number;
    newCustomersInRange: number;
  };
  statusBreakdown: {
    Lead: number;
    Prospect: number;
    Customer: number;
    Inactive: number;
  };
  temperatureBreakdown: {
    hot: number;
    warm: number;
    cold: number;
  };
  monthlyPerformance: Array<{
    month: string;
    newCustomers: number;
    conversions: number;
    conversionRate: string;
  }>;
  recentActivity: Array<{
    _id: string;
    name: string;
    company?: string;
    status: string;
    temperature?: string;
    updatedAt: string;
  }>;
  goals: {
    monthlyGoal: number;
    conversionGoal: number;
    monthlyProgress: string;
    conversionProgress: string;
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
  pink: '#ec4899'
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger];

function EmployeeAnalyticsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/analytics?timeRange=${timeRange}`);
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

  // Get temperature badge
  const getTemperatureBadge = (temp?: string) => {
    if (!temp) return null;
    
    const variants = {
      hot: { variant: 'destructive' as const, icon: '🔥', label: 'Hot' },
      warm: { variant: 'default' as const, icon: '🌡️', label: 'Warm' },
      cold: { variant: 'secondary' as const, icon: '❄️', label: 'Cold' }
    };
    
    const config = variants[temp as keyof typeof variants];
    if (!config) return null;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <span>{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="My Performance"
          description="Your personal performance analytics and insights"
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
          title="My Performance"
          description="Your personal performance analytics and insights"
        />
        <Alert>
          <AlertDescription>Failed to load analytics data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Leads', value: analytics.statusBreakdown.Lead, color: COLORS.secondary },
    { name: 'Prospects', value: analytics.statusBreakdown.Prospect, color: COLORS.accent },
    { name: 'Customers', value: analytics.statusBreakdown.Customer, color: COLORS.primary },
    { name: 'Inactive', value: analytics.statusBreakdown.Inactive, color: COLORS.danger }
  ];

  const temperatureData = [
    { name: 'Hot', value: analytics.temperatureBreakdown.hot, color: COLORS.danger },
    { name: 'Warm', value: analytics.temperatureBreakdown.warm, color: COLORS.accent },
    { name: 'Cold', value: analytics.temperatureBreakdown.cold, color: COLORS.secondary }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="My Performance"
        description="Your personal performance analytics and insights"
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
        <Button variant="outline" onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
              Your current portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.newCustomersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              vs {analytics.overview.newCustomersLastMonth} last month
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
      </div>      {/* Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Monthly Goal</span>
            </CardTitle>
            <CardDescription>New customers this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {analytics.overview.newCustomersThisMonth} / {analytics.goals.monthlyGoal}
              </span>
              <span className="text-sm text-muted-foreground">
                {analytics.goals.monthlyProgress}%
              </span>
            </div>
            <Progress value={parseFloat(analytics.goals.monthlyProgress)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {analytics.goals.monthlyGoal - analytics.overview.newCustomersThisMonth > 0 ? 
                `${analytics.goals.monthlyGoal - analytics.overview.newCustomersThisMonth} more needed` : 
                'Goal achieved! 🎉'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Conversion Goal</span>
            </CardTitle>
            <CardDescription>Target conversion rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {analytics.overview.conversionRate}% / {analytics.goals.conversionGoal}%
              </span>
              <span className="text-sm text-muted-foreground">
                {analytics.goals.conversionProgress}%
              </span>
            </div>
            <Progress value={parseFloat(analytics.goals.conversionProgress)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {analytics.overview.conversionRate >= analytics.goals.conversionGoal ? 
                'Excellent conversion rate! 🌟' : 
                'Keep improving your conversion process'
              }
            </p>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <PerformanceInsights analytics={analytics} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Monthly Performance</span>
            </CardTitle>
            <CardDescription>New customers and conversions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newCustomers" stroke={COLORS.primary} strokeWidth={2} name="New Customers" />
                <Line type="monotone" dataKey="conversions" stroke={COLORS.secondary} strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customer Status</span>
            </CardTitle>
            <CardDescription>Breakdown by customer status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5" />
              <span>Customer Temperature</span>
            </CardTitle>
            <CardDescription>Engagement level breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Temperature Breakdown Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5" />
              <span>Temperature Breakdown</span>
            </CardTitle>
            <CardDescription>Detailed engagement analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔥</span>
                <span className="font-medium">Hot Customers</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{analytics.temperatureBreakdown.hot}</div>
                <div className="text-xs text-muted-foreground">High priority</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🌡️</span>
                <span className="font-medium">Warm Customers</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600">{analytics.temperatureBreakdown.warm}</div>
                <div className="text-xs text-muted-foreground">Regular follow-up</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">❄️</span>
                <span className="font-medium">Cold Customers</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{analytics.temperatureBreakdown.cold}</div>
                <div className="text-xs text-muted-foreground">Long-term nurturing</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Customers updated in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <Alert>
              <AlertDescription>No recent activity in the last 7 days.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      {activity.company && (
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {activity.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(activity.status)}
                    {getTemperatureBadge(activity.temperature)}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📊 Portfolio Health</h4>
              <p className="text-sm text-blue-700">
                You manage {analytics.overview.totalCustomers} customers with a {analytics.overview.conversionRate}% conversion rate.
                {analytics.temperatureBreakdown.hot > 0 && 
                  ` You have ${analytics.temperatureBreakdown.hot} hot leads that need immediate attention.`
                }
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">🎯 Goal Progress</h4>
              <p className="text-sm text-green-700">
                {parseFloat(analytics.goals.monthlyProgress) >= 100 ? 
                  'Congratulations! You\'ve exceeded your monthly goal.' :
                  `You're ${analytics.goals.monthlyProgress}% towards your monthly goal of ${analytics.goals.monthlyGoal} customers.`
                }
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">📈 Growth Trend</h4>
              <p className="text-sm text-orange-700">
                {analytics.overview.growthRate >= 0 ? 
                  `Great job! You're growing at ${analytics.overview.growthRate}% compared to last month.` :
                  `Focus on customer acquisition - you're down ${Math.abs(analytics.overview.growthRate)}% from last month.`
                }
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">🌡️ Temperature Focus</h4>
              <p className="text-sm text-purple-700">
                {analytics.temperatureBreakdown.hot > analytics.temperatureBreakdown.cold ? 
                  'Excellent! You have more hot leads than cold ones.' :
                  'Consider warming up your cold leads through targeted engagement.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Protect this page - Employee, Manager, and Admin access
export default withRoleAuth(EmployeeAnalyticsPage, {
  allowedRoles: ['Employee', 'Manager', 'Admin'],
  redirectTo: '/unauthorized'
});
