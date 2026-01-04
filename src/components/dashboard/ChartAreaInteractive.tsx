import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
    { month: "Jan", patents: 2 },
    { month: "Feb", patents: 3 },
    { month: "Mar", patents: 5 },
    { month: "Apr", patents: 4 },
    { month: "May", patents: 7 },
    { month: "Jun", patents: 8 },
    { month: "Jul", patents: 10 },
];

export function ChartAreaInteractive() {
    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Patent Filing Trends</CardTitle>
                <CardDescription>
                    Monthly patent applications and approvals over the last 7 months
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 md:px-8 pb-4">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorPatents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tickMargin={10}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    color: "hsl(var(--foreground))",
                                    borderRadius: "var(--radius)"
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="patents"
                                stroke="hsl(var(--primary))"
                                fillOpacity={1}
                                fill="url(#colorPatents)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
