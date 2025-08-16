import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks, Clock, CheckCircle, AlertCircle, FileText, Calendar, TrendingUp, Eye } from "lucide-react";
import { Link } from "wouter";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-500",
    progress: 10,
    icon: FileText,
    description: "Patent is in draft stage"
  },
  pending: {
    label: "Pending Review",
    color: "bg-yellow-500",
    progress: 30,
    icon: Clock,
    description: "Awaiting initial review"
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-500",
    progress: 60,
    icon: AlertCircle,
    description: "Currently being examined"
  },
  approved: {
    label: "Approved",
    color: "bg-green-500",
    progress: 100,
    icon: CheckCircle,
    description: "Patent has been approved"
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500",
    progress: 100,
    icon: AlertCircle,
    description: "Patent application rejected"
  },
  expired: {
    label: "Expired",
    color: "bg-gray-400",
    progress: 100,
    icon: Clock,
    description: "Patent has expired"
  }
};

export default function StatusTracking() {
  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => fetch('/api/patents', { credentials: 'include' }).then(res => res.json()),
  });

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetch('/api/dashboard/activities?limit=20', { credentials: 'include' }).then(res => res.json()),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  const getStatusDistribution = () => {
    if (!patents || !Array.isArray(patents)) return [];
    
    const distribution = patents.reduce((acc: any, patent: any) => {
      const status = patent.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      ...getStatusInfo(status)
    }));
  };

  const getUpcomingDeadlines = () => {
    if (!patents || !Array.isArray(patents)) return [];
    
    return patents
      .filter((patent: any) => patent.expiresAt)
      .sort((a: any, b: any) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
      .slice(0, 5);
  };

  const getRecentUpdates = () => {
    if (!activities || !Array.isArray(activities)) return [];
    return activities.slice(0, 10);
  };

  if (loadingPatents || loadingActivities) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Status Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor patent application progress and review timelines
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statusDistribution = getStatusDistribution();
  const upcomingDeadlines = getUpcomingDeadlines();
  const recentUpdates = getRecentUpdates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor patent application progress, review timelines, and manage important deadlines
        </p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statusDistribution.map((item) => {
          const StatusIcon = item.icon;
          return (
            <Card key={item.status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <StatusIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.count as number}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patent Status List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              All Patents Status
            </CardTitle>
            <CardDescription>
              Detailed view of all your patent applications and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {patents && patents.length > 0 ? (
                  patents.map((patent: any) => {
                    const statusInfo = getStatusInfo(patent.status || 'draft');
                    
                    return (
                      <Card key={patent.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-sm">{patent.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  ID: {patent.id}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {statusInfo.label}
                              </Badge>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{statusInfo.progress}%</span>
                              </div>
                              <Progress value={statusInfo.progress} className="h-2" />
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-medium text-muted-foreground">Created</p>
                                <p>{patent.createdAt ? formatDate(patent.createdAt) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Last Updated</p>
                                <p>{patent.updatedAt ? formatDate(patent.updatedAt) : 'N/A'}</p>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Link href={`/patents/my-patents`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                              {patent.hederaTopicId && (
                                <Link href={`/verification/blockchain`}>
                                  <Button variant="outline" size="sm">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verify
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <ListChecks className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No patents to track yet</p>
                    <Link href="/patents/file">
                      <Button className="mt-4" size="sm">
                        File Your First Patent
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((patent: any) => (
                    <div key={patent.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-xs">{patent.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Expires: {formatDate(patent.expiresAt)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {Math.ceil((new Date(patent.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No upcoming deadlines</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {recentUpdates.length > 0 ? (
                    recentUpdates.map((activity: any, index: number) => (
                      <div key={activity.id || index} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium">
                              {activity.description || 'Patent activity'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.createdAt ? formatDate(activity.createdAt) : 'Recently'}
                            </p>
                          </div>
                        </div>
                        {index < recentUpdates.length - 1 && <Separator />}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/patents/file">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-3 w-3 mr-2" />
                    File New Patent
                  </Button>
                </Link>
                <Link href="/verification/blockchain">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Verify Patents
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="h-3 w-3 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}