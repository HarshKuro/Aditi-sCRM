import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Users,
  Thermometer,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface PerformanceInsightsProps {
  analytics: {
    overview: {
      totalCustomers: number;
      newCustomersThisMonth: number;
      newCustomersLastMonth: number;
      growthRate: number;
      conversionRate: number;
    };
    temperatureBreakdown: {
      hot: number;
      warm: number;
      cold: number;
    };
    goals: {
      monthlyGoal: number;
      conversionGoal: number;
      monthlyProgress: string;
      conversionProgress: string;
    };
  };
}

export function PerformanceInsights({ analytics }: PerformanceInsightsProps) {
  const getInsightColor = (type: 'success' | 'warning' | 'info' | 'danger') => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-orange-50 border-orange-200 text-orange-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      danger: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[type];
  };

  const generateInsights = () => {
    const insights = [];
    
    // Growth insights
    if (analytics.overview.growthRate > 20) {
      insights.push({
        type: 'success' as const,
        title: '🚀 Exceptional Growth!',
        message: `You're growing at ${analytics.overview.growthRate}% - keep up the excellent work!`
      });
    } else if (analytics.overview.growthRate < -10) {
      insights.push({
        type: 'warning' as const,
        title: '📉 Growth Opportunity',
        message: `Focus on customer acquisition to reverse the ${Math.abs(analytics.overview.growthRate)}% decline.`
      });
    }

    // Conversion insights
    if (analytics.overview.conversionRate > 30) {
      insights.push({
        type: 'success' as const,
        title: '🎯 High Conversion Rate',
        message: `Your ${analytics.overview.conversionRate}% conversion rate is excellent!`
      });
    } else if (analytics.overview.conversionRate < 15) {
      insights.push({
        type: 'info' as const,
        title: '🔧 Conversion Improvement',
        message: 'Consider reviewing your sales process to improve conversion rates.'
      });
    }

    // Temperature insights
    const totalCustomers = analytics.temperatureBreakdown.hot + analytics.temperatureBreakdown.warm + analytics.temperatureBreakdown.cold;
    const hotPercentage = totalCustomers > 0 ? (analytics.temperatureBreakdown.hot / totalCustomers) * 100 : 0;
    
    if (hotPercentage > 25) {
      insights.push({
        type: 'danger' as const,
        title: '🔥 Hot Leads Alert',
        message: `You have ${analytics.temperatureBreakdown.hot} hot leads needing immediate attention!`
      });
    }

    // Goal insights
    if (parseFloat(analytics.goals.monthlyProgress) >= 100) {
      insights.push({
        type: 'success' as const,
        title: '🏆 Goal Achieved!',
        message: 'Congratulations on exceeding your monthly target!'
      });
    } else if (parseFloat(analytics.goals.monthlyProgress) < 50) {
      insights.push({
        type: 'warning' as const,
        title: '⏰ Goal Progress',
        message: `You're at ${analytics.goals.monthlyProgress}% of your monthly goal. Time to accelerate!`
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const insights = generateInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span>Performance Insights</span>
        </CardTitle>
        <CardDescription>AI-powered recommendations for your performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Keep up the great work! 🌟</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <h4 className="font-medium mb-1">{insight.title}</h4>
              <p className="text-sm">{insight.message}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceInsights;
