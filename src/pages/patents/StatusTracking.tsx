import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks, Clock, CheckCircle, AlertCircle, FileText, Calendar, TrendingUp, Eye, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { patentAPI, dashboardAPI, type Patent } from "@/lib/apiService";

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
    queryFn: () => patentAPI.getPatents(),
  });

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => dashboardAPI.getActivities(20),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  };

  if (loadingPatents || loadingActivities) {
    return <div className="space-y-6 p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your patent registration progress on the Base blockchain.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Active Trackers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {patents && patents.length > 0 ? (
                  patents.map((patent: Patent) => {
                    const statusInfo = getStatusInfo(patent.status || 'draft');
                    return (
                      <Card key={patent.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="space-y-1">
                              <h4 className="font-bold text-lg">{patent.title}</h4>
                              <p className="text-xs text-muted-foreground font-mono">ID: {patent.id}</p>
                            </div>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>Registration Progress</span>
                              <span>{statusInfo.progress}%</span>
                            </div>
                            <Progress value={statusInfo.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground italic">{statusInfo.description}</p>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-muted-foreground" />
                              <span>Filed: {formatDate(patent.createdAt as any)}</span>
                            </div>
                            {patent.blockchainTxHash && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={14} />
                                <span>Secured on Base</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Link href="/patents/my-patents">
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </Link>
                            {patent.blockchainTxHash && (
                              <a
                                href={`https://sepolia.basescan.org/tx/${patent.blockchainTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                              >
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Verify
                                </Button>
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">No patents found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={18} />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activities?.map((activity: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}