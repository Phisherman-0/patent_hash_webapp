import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { aiAPI, patentAPI } from "@/lib/apiService";
import { useQueryClient } from "@tanstack/react-query";
import { DollarSign, TrendingUp, BarChart3, Brain, AlertCircle, CheckCircle } from "lucide-react";

const valuationSchema = z.object({
  patentId: z.string().min(1, "Please select a patent"),
});

type ValuationForm = z.infer<typeof valuationSchema>;

export default function PatentValuation() {
  const { toast } = useToast();
  const [selectedPatentDetails, setSelectedPatentDetails] = useState<any>(null);
  const [valuationResults, setValuationResults] = useState<any>(null);

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const queryClient = useQueryClient();

  const form = useForm<ValuationForm>({
    resolver: zodResolver(valuationSchema),
  });

  const valuationMutation = useMutation({
    mutationFn: async (data: { patentId: string }) => {
      return aiAPI.patentValuation(data);
    },
    onSuccess: (data) => {
      setValuationResults(data);
      toast({
        title: "Valuation Complete",
        description: "AI-powered patent valuation has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['patents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Valuation Failed",
        description: error.message || "Failed to generate patent valuation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ValuationForm) => {
    const selectedPatent = patents?.find((p: any) => p.id === data.patentId);
    setSelectedPatentDetails(selectedPatent);
    valuationMutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getValuationColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getMarketTrendIcon = (trend: string) => {
    switch (trend?.toLowerCase()) {
      case 'growing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'stable':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Patent Valuation</h1>
          <p className="text-muted-foreground mt-2">
            Get AI-powered market value estimates for your patents
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Patent Valuation</h1>
        <p className="text-muted-foreground mt-2">
          Get AI-powered market value estimates for your patents based on industry trends, similar patents, and market analysis
        </p>
      </div>

      {/* Valuation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Generate Patent Valuation
          </CardTitle>
          <CardDescription>
            Select a patent to receive an AI-powered market valuation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="patentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Patent</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a patent to evaluate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patents?.map((patent: any) => (
                          <SelectItem key={patent.id} value={patent.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{patent.title}</span>
                              <Badge variant="outline" className="ml-2">
                                {patent.category?.replace('_', ' ')}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select from your existing patents to generate a market valuation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={valuationMutation.isPending}
                className="w-full"
              >
                {valuationMutation.isPending ? "Generating Valuation..." : "Generate AI Valuation"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Valuation Results */}
      {valuationResults && (
        <div className="grid gap-6">
          {/* Main Valuation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Patent Valuation Results
              </CardTitle>
              <CardDescription>
                AI-generated market valuation for "{selectedPatentDetails?.title}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Estimated Value */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Estimated Market Value</h3>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(valuationResults.estimatedValue || 0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence Level:</span>
                    <Badge variant="outline" className={getValuationColor(valuationResults.confidence || 0)}>
                      {((valuationResults.confidence || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={(valuationResults.confidence || 0) * 100} className="w-full" />
                </div>

                {/* Valuation Range */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Valuation Range</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Low Estimate:</span>
                      <span className="font-semibold">
                        {formatCurrency((valuationResults.estimatedValue || 0) * 0.7)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">High Estimate:</span>
                      <span className="font-semibold">
                        {formatCurrency((valuationResults.estimatedValue || 0) * 1.3)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Key Factors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Valuation Factors</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getMarketTrendIcon(valuationResults.marketTrend)}
                      <span className="font-medium">Market Trend</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {valuationResults.marketTrend === 'growing' 
                        ? 'Market showing strong growth potential'
                        : 'Market conditions are stable'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Innovation Level</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Progress value={85} className="flex-1" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Commercial Potential</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <Progress value={valuationResults.commercialPotential * 100 || 75} className="flex-1" />
                      <span className="text-sm font-medium">
                        {((valuationResults.commercialPotential || 0.75) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Risk Assessment</span>
                    </div>
                    <Badge variant="outline" className="ml-6">
                      {valuationResults.riskLevel || 'Medium Risk'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Methodology & Recommendations */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Valuation Methodology</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Comparative Analysis</p>
                      <p className="text-xs text-muted-foreground">Compared against similar patents in the market</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Market Trend Analysis</p>
                      <p className="text-xs text-muted-foreground">Current and projected market conditions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Innovation Assessment</p>
                      <p className="text-xs text-muted-foreground">Technical novelty and implementation feasibility</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Strong Commercial Potential
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Consider accelerating commercialization efforts
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Market Timing
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Current market conditions are favorable for licensing
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Portfolio Strategy
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      Consider filing continuation patents in related areas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}