import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, Clock, Shield, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
    totalPatents: number;
    pendingReviews: number;
    blockchainVerified: number;
    portfolioValue: string;
}

interface SectionCardsProps {
    stats?: DashboardStats;
}

export function SectionCards({ stats }: SectionCardsProps) {
    const cards = [
        {
            title: "Total Patents",
            value: stats?.totalPatents || 0,
            icon: FileText,
            trend: "Growing strong",
            trendColor: "text-green-600",
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
        },
        {
            title: "Pending Reviews",
            value: stats?.pendingReviews || 0,
            icon: Clock,
            trend: "Avg. 14 days",
            trendColor: "text-yellow-600",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
        },
        {
            title: "Blockchain Verified",
            value: stats?.blockchainVerified || 0,
            icon: Shield,
            trend: "100% secure",
            trendColor: "text-green-600",
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
        },
        {
            title: "Portfolio Value",
            value: formatCurrency(stats?.portfolioValue || '0'),
            icon: BarChart3,
            trend: "+15% growth",
            trendColor: "text-green-600",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card key={index}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground text-sm font-medium truncate">{card.title}</p>
                                    <p className="text-2xl lg:text-3xl font-bold text-foreground truncate">{card.value}</p>
                                    <p className={`${card.trendColor} text-sm mt-1 truncate`}>
                                        <TrendingUp size={14} className="inline mr-1 flex-shrink-0" />
                                        {card.trend}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={card.iconColor} size={24} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
