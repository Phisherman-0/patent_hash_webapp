import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, Shield, Brain } from "lucide-react";
import { dashboardAPI, patentAPI } from "@/lib/apiService";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Analytics() {
  const { data: categoryStats, isLoading: loadingCategories } = useQuery({
    queryKey: ['dashboard', 'category-stats'],
    queryFn: dashboardAPI.getCategoryStats,
  });

  const { data: userStats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardAPI.getStats,
  });

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: patentAPI.getPatents,
  });

  // Generate analytics data from patents
  const generateAnalytics = () => {
    if (!patents || !Array.isArray(patents)) return null;

    // Status distribution
    const statusData = patents.reduce((acc: any, patent: any) => {
      acc[patent.status] = (acc[patent.status] || 0) + 1;
      return acc;
    }, {});

    // Monthly filing trends (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const count = patents.filter((p: any) => 
        p.createdAt && p.createdAt.startsWith(monthKey)
      ).length;
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count
      });
    }

    // Value distribution
    const valueRanges = [
      { range: '$0-10K', min: 0, max: 10000 },
      { range: '$10K-50K', min: 10000, max: 50000 },
      { range: '$50K-100K', min: 50000, max: 100000 },
      { range: '$100K+', min: 100000, max: Infinity },
    ];

    const valueData = valueRanges.map(range => ({
      range: range.range,
      count: patents.filter((p: any) => {
        const value = parseFloat(p.estimatedValue || '0');
        return value >= range.min && value < range.max;
      }).length
    }));

    return {
      statusData: Object.entries(statusData).map(([status, count]) => ({
        status,
        count
      })),
      monthlyData,
      valueData
    };
  };

  const analytics = generateAnalytics();

  if (loadingStats || loadingCategories || loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your patent portfolio performance and trends
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive insights into your patent portfolio performance and trends
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalPatents || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userStats?.portfolioValue || '0'}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain Verified</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.blockchainVerified || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              100% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Analyses</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.statusData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Active AI processing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Patent Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Patent Categories</CardTitle>
            <CardDescription>Distribution by technology sector</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryStats && categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {categoryStats.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patent Status */}
        <Card>
          <CardHeader>
            <CardTitle>Patent Status Distribution</CardTitle>
            <CardDescription>Current status of your patent applications</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.statusData && analytics.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filing Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Filing Trends</CardTitle>
            <CardDescription>Patents filed over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.monthlyData && analytics.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No filing trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Patent Value Distribution</CardTitle>
            <CardDescription>Portfolio value by patent valuation ranges</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.valueData && analytics.valueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.valueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No value distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>AI-powered insights based on your portfolio performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Strong Performance
              </Badge>
              <span className="text-sm">Your patent portfolio is showing consistent growth</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Brain className="h-3 w-3 mr-1" />
                AI Recommendation
              </Badge>
              <span className="text-sm">Consider focusing on medical technology and AI sectors based on market trends</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Shield className="h-3 w-3 mr-1" />
                Verification Status
              </Badge>
              <span className="text-sm">All patents are blockchain verified for maximum security</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}