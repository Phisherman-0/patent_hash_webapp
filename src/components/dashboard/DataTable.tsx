import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface Activity {
    description: string;
    activityType: string;
    createdAt: string;
}

interface DataTableProps {
    data: Activity[];
}

export function DataTable({ data }: DataTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Recent actions and updates on your patents</CardDescription>
            </CardHeader>
            <CardContent>
                {data && data.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((activity, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center space-x-2">
                                            {activity.activityType.includes('verified') || activity.activityType.includes('approved') ? (
                                                <CheckCircle className="text-green-500 h-4 w-4" />
                                            ) : (
                                                <Clock className="text-yellow-500 h-4 w-4" />
                                            )}
                                            <span>{activity.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {activity.activityType.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        No recent activity found
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
