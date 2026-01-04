import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { clearUser } from "@/store/authSlice";
import { dashboardAPI, DashboardStats, Activity } from "@/lib/apiService";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionCards } from "@/components/dashboard/SectionCards";
import { ChartAreaInteractive } from "@/components/dashboard/ChartAreaInteractive";
import { DataTable } from "@/components/dashboard/DataTable";
import { Lightbulb, Plus, Shield } from "lucide-react";

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



  if (statsLoading || activitiesLoading) {
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



  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
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
              <div className="flex gap-2">
                <Button
                  className="bg-white text-primary px-6 py-2 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
                  onClick={() => navigate('/patents/my-patents')}
                >
                  View All Updates
                </Button>
                <Button
                  className="bg-primary-dark border border-white/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark/80 transition-colors"
                  onClick={() => navigate('/patents/file')}
                >
                  File Patent
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <Lightbulb size={64} className="text-orange-200" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartAreaInteractive />
            {/* Quick Actions included alongside chart */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4 border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5"
                    onClick={() => navigate('/patents/file')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    File New Patent
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => navigate('/patents/verify')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Patent
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          <DataTable data={activities || []} />
        </div>
      </div>
    </div>
  );
}
