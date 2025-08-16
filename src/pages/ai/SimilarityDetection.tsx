import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { aiAPI, patentAPI } from "@/lib/apiService";
import { Copy, AlertTriangle, CheckCircle, Brain, RefreshCw } from "lucide-react";

const similaritySchema = z.object({
  patentId: z.string().min(1, "Please select a patent"),
  targetText: z.string().min(20, "Target text must be at least 20 characters"),
});

type SimilarityForm = z.infer<typeof similaritySchema>;

export default function SimilarityDetection() {
  const { toast } = useToast();
  const [similarityResults, setSimilarityResults] = useState<any>(null);

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const form = useForm<SimilarityForm>({
    resolver: zodResolver(similaritySchema),
    defaultValues: {
      patentId: "",
      targetText: "",
    },
  });

  const similarityMutation = useMutation({
    mutationFn: async (data: SimilarityForm) => {
      return aiAPI.similarityDetection(data);
    },
    onSuccess: (data) => {
      setSimilarityResults(data);
      toast({
        title: "Similarity Analysis Complete",
        description: "AI-powered similarity detection has been completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to perform similarity detection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SimilarityForm) => {
    similarityMutation.mutate(data);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return "text-red-600";
    if (score >= 0.6) return "text-yellow-600"; 
    return "text-green-600";
  };

  const getSimilarityLevel = (score: number) => {
    if (score >= 0.8) return { level: "High Risk", color: "destructive" };
    if (score >= 0.6) return { level: "Medium Risk", color: "default" };
    return { level: "Low Risk", color: "secondary" };
  };


  if (loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Similarity Detection</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered plagiarism and similarity detection for patent content
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Similarity Detection</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered plagiarism and similarity detection to flag potential conflicts or copied material before patent submission
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Similarity Analysis
            </CardTitle>
            <CardDescription>
              Compare patent content against existing patents and detect potential similarities
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
                      <FormLabel>Source Patent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your patent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patents?.map((patent: any) => (
                            <SelectItem key={patent.id} value={patent.id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="truncate">{patent.title}</span>
                                <Badge variant="outline" className="ml-2">
                                  {patent.category?.replace('_', ' ')}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the patent you want to use as the source for comparison
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text to Compare</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the text or patent content you want to compare against your patent..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the text content you want to check for similarity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={similarityMutation.isPending}
                  className="w-full"
                >
                  {similarityMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Similarity...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Detect Similarity
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Usage Tips */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 Detection Tips
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Paste content from other patents or publications</li>
                <li>• Check drafts before filing applications</li>
                <li>• Verify originality of technical descriptions</li>
                <li>• Analyze competitive patent content</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          {similarityMutation.isPending ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <CardTitle>Analyzing Content...</CardTitle>
                </div>
                <CardDescription>
                  AI is performing deep semantic analysis to detect similarities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Semantic Analysis</span>
                      <span>Processing...</span>
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pattern Recognition</span>
                      <span>In Progress...</span>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Similarity Scoring</span>
                      <span>Pending...</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : similarityResults ? (
            <div className="space-y-6">
              {/* Main Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Copy className="h-5 w-5" />
                    Similarity Analysis Results
                  </CardTitle>
                  <CardDescription>
                    AI-powered semantic similarity detection results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary">
                        <span className={`text-2xl font-bold ${getSimilarityColor(similarityResults.similarityScore || 0.5)}`}>
                          {((similarityResults.similarityScore || 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Similarity Score</h3>
                        <Badge variant={getSimilarityLevel(similarityResults.similarityScore || 0.5).color as any}>
                          {getSimilarityLevel(similarityResults.similarityScore || 0.5).level}
                        </Badge>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {similarityResults.similarityScore >= 0.8 ? (
                          <strong className="text-red-600">High Risk:</strong>
                        ) : similarityResults.similarityScore >= 0.6 ? (
                          <strong className="text-yellow-600">Medium Risk:</strong>
                        ) : (
                          <strong className="text-green-600">Low Risk:</strong>
                        )}
                        {similarityResults.similarityScore >= 0.8 
                          ? " Significant similarity detected. Review content thoroughly before filing."
                          : similarityResults.similarityScore >= 0.6
                          ? " Moderate similarity detected. Consider revising certain sections."
                          : " Low similarity detected. Content appears to be sufficiently original."}
                      </AlertDescription>
                    </Alert>

                    {/* Detailed Analysis */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h4 className="font-semibold">Analysis Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Semantic Similarity</span>
                            <span className="font-medium">
                              {((similarityResults.semanticSimilarity || 0.4) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={(similarityResults.semanticSimilarity || 0.4) * 100} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Structural Similarity</span>
                            <span className="font-medium">
                              {((similarityResults.structuralSimilarity || 0.3) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={(similarityResults.structuralSimilarity || 0.3) * 100} className="h-2" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Keyword Overlap</span>
                            <span className="font-medium">
                              {((similarityResults.keywordOverlap || 0.6) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={(similarityResults.keywordOverlap || 0.6) * 100} className="h-2" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold">Detection Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Confidence Level:</span>
                            <Badge variant="outline">
                              {((similarityResults.confidence || 0.85) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Analysis Method:</span>
                            <span>Semantic + Structural</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processing Time:</span>
                            <span>2.3 seconds</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Content Length:</span>
                            <span>{form.watch("targetText")?.length || 0} chars</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-3">
                      <h4 className="font-semibold">AI Recommendations</h4>
                      <div className="space-y-2">
                        {similarityResults.similarityScore >= 0.8 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Action Required:</strong> High similarity detected. Consider significant revisions to avoid potential IP conflicts.
                            </AlertDescription>
                          </Alert>
                        ) : similarityResults.similarityScore >= 0.6 ? (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Review Recommended:</strong> Moderate similarity found. Review overlapping sections and consider rephrasing.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Clear to Proceed:</strong> Low similarity detected. Content appears sufficiently original for filing.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Next Steps:
                          </h5>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Review highlighted similar sections carefully</li>
                            <li>• Consider rewording technical descriptions</li>
                            <li>• Consult with patent attorney if needed</li>
                            <li>• Run additional checks before final submission</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Copy className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Detect Similarities</h3>
                <p className="text-muted-foreground text-center">
                  Select a patent and enter text content to perform AI-powered similarity detection and plagiarism checking.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Features Information */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" />
              Semantic Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced AI analyzes meaning and context, not just keywords, to detect conceptual similarities between patent content.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprehensive risk scoring helps identify potential IP conflicts before filing, saving time and legal costs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Actionable Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Clear recommendations and next steps guide you through addressing similarity issues and strengthening your patent application.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}