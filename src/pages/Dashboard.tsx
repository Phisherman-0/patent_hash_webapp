import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { clearUser } from "@/store/authSlice";
import { dashboardAPI, DashboardStats, Activity, CategoryStat } from "@/lib/apiService";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Clock, 
  Shield, 
  TrendingUp,
  CheckCircle,
  Brain,
  Plus,
  Search,
  Edit3,
  Lightbulb,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);
  const [, navigate] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        dispatch(clearUser());
      }, 500);
      return;
    }
  }, [user, isInitialized, isLoading, toast, dispatch]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardAPI.getStats,
    enabled: !!user && isInitialized && !isLoading,
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["dashboard-activities"],
    queryFn: () => dashboardAPI.getActivities(10),
    enabled: !!user && isInitialized && !isLoading,
    retry: false,
  });

  const { data: categoryStats, isLoading: categoryLoading } = useQuery<CategoryStat[]>({
    queryKey: ["dashboard-category-stats"],
    queryFn: dashboardAPI.getCategoryStats,
    enabled: !!user && isInitialized && !isLoading,
    retry: false,
  });

  if (statsLoading || activitiesLoading || categoryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      medical_technology: 'bg-primary',
      software_ai: 'bg-blue-500',
      renewable_energy: 'bg-green-500',
      manufacturing: 'bg-purple-500',
      biotechnology: 'bg-pink-500',
      automotive: 'bg-yellow-500',
      telecommunications: 'bg-indigo-500',
      other: 'bg-muted-foreground',
    };
    return colors[category] || 'bg-muted-foreground';
  };

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!</h2>
            <p className="text-orange-100 mb-4">
              {(stats?.pendingReviews || 0) > 0 
                ? `You have ${stats?.pendingReviews || 0} patents pending review and new AI recommendations.`
                : "Your patent portfolio is up to date. Ready to file a new patent?"
              }
            </p>
            <Button 
              className="bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
              onClick={() => navigate('/patents/my-patents')}
            >
              View All Updates
            </Button>
          </div>
          <div className="hidden md:block">
            <Lightbulb size={64} className="text-orange-200" />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm font-medium truncate">Total Patents</p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats?.totalPatents || 0}</p>
                <p className="text-green-600 text-sm mt-1 truncate">
                  <TrendingUp size={14} className="inline mr-1 flex-shrink-0" />
                  Growing strong
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm font-medium truncate">Pending Reviews</p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats?.pendingReviews || 0}</p>
                <p className="text-yellow-600 text-sm mt-1 truncate">
                  <Clock size={14} className="inline mr-1 flex-shrink-0" />
                  Avg. 14 days
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm font-medium truncate">Blockchain Verified</p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground">{stats?.blockchainVerified || 0}</p>
                <p className="text-green-600 text-sm mt-1 truncate">
                  <Shield size={14} className="inline mr-1 flex-shrink-0" />
                  100% secure
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm font-medium truncate">Portfolio Value</p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground truncate">
                  {formatCurrency(stats?.portfolioValue || '0')}
                </p>
                <p className="text-green-600 text-sm mt-1 truncate">
                  <TrendingUp size={14} className="inline mr-1 flex-shrink-0" />
                  +15% growth
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Patent Activity</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary-dark"
                onClick={() => navigate('/patents/my-patents')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 4).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="text-green-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.activityType} • {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {activity.activityType}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No recent activity</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by filing your first patent.</p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/patents/file')}>
                    <Plus className="mr-2" size={16} />
                    File New Patent
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/patents/file')}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Plus className="text-primary" size={20} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">File New Patent</p>
                <p className="text-sm text-muted-foreground truncate">Upload and submit new IP</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border border-border hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/ai/prior-art-search')}
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Search className="text-blue-600" size={20} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">Prior Art Search</p>
                <p className="text-sm text-muted-foreground truncate">AI-powered similarity check</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border border-border hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/patents/verify')}
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Shield className="text-green-600" size={20} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">Verify Patent</p>
                <p className="text-sm text-muted-foreground truncate">Blockchain verification</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto p-4 border border-border hover:border-primary hover:bg-primary/5"
              onClick={() => navigate('/patents/drafting')}
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Edit3 className="text-purple-600" size={20} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">AI Drafting</p>
                <p className="text-sm text-muted-foreground truncate">Generate patent documents</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patent Categories Chart */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Patent Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {categoryStats && categoryStats.length > 0 ? (
              <div className="space-y-4">
                {categoryStats.map((category: any) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getCategoryColor(category.category)}`}></div>
                      <span className="text-sm font-medium text-foreground truncate">
                        {formatCategoryName(category.category)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Progress value={category.percentage} className="w-24 lg:w-32" />
                      <span className="text-sm font-medium text-muted-foreground w-8 lg:w-10 text-right">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No category data</h3>
                <p className="mt-1 text-sm text-muted-foreground">File patents to see category breakdown.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle>AI Insights</CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <Brain className="mr-1" size={12} />
                AI Powered
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="text-blue-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Innovation Opportunity</h4>
                  <p className="text-sm text-muted-foreground">
                    AI detected a gap in quantum computing patents for healthcare applications. 
                    Consider expanding your portfolio in this area.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-yellow-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Portfolio Health</h4>
                  <p className="text-sm text-muted-foreground">
                    Your patent portfolio shows strong diversity across technology sectors. 
                    Consider filing continuation patents for key innovations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="text-green-600" size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Portfolio Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Your patents show strong commercial potential. 
                    Consider licensing opportunities to maximize revenue.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
