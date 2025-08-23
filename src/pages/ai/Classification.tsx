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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { aiAPI, patentAPI } from "@/lib/apiService";
import { Tags, Brain, FileText, TrendingUp, RefreshCw, Lightbulb, Target } from "lucide-react";

const classificationSchema = z.object({
  text: z.string().min(50, "Text must be at least 50 characters for accurate classification"),
  mode: z.enum(["description", "patent_id"]),
  patentId: z.string().optional(),
});

type ClassificationForm = z.infer<typeof classificationSchema>;

const categoryInfo = {
  medical_technology: {
    label: "Medical Technology",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    description: "Healthcare devices, pharmaceuticals, medical procedures",
    examples: ["Medical devices", "Drug delivery systems", "Diagnostic tools", "Surgical instruments"]
  },
  software_ai: {
    label: "Software & AI",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
    description: "Software algorithms, artificial intelligence, machine learning",
    examples: ["AI algorithms", "Software applications", "Data processing", "Machine learning models"]
  },
  renewable_energy: {
    label: "Renewable Energy",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    description: "Solar, wind, hydroelectric, and sustainable energy solutions",
    examples: ["Solar panels", "Wind turbines", "Energy storage", "Smart grid technology"]
  },
  manufacturing: {
    label: "Manufacturing",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    description: "Industrial processes, manufacturing equipment, automation",
    examples: ["Industrial machinery", "Manufacturing processes", "Quality control", "Automation systems"]
  },
  biotechnology: {
    label: "Biotechnology",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    description: "Genetic engineering, bioprocessing, life sciences",
    examples: ["Genetic engineering", "Bioprocessing", "Molecular biology", "Protein engineering"]
  },
  automotive: {
    label: "Automotive",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    description: "Vehicle technology, transportation systems, automotive components",
    examples: ["Engine technology", "Safety systems", "Vehicle electronics", "Transportation infrastructure"]
  },
  telecommunications: {
    label: "Telecommunications",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    description: "Communication systems, networking, wireless technology",
    examples: ["Wireless communication", "Network protocols", "Communication devices", "Signal processing"]
  },
  other: {
    label: "Other",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    description: "Technologies not fitting into standard categories",
    examples: ["Novel technologies", "Cross-domain innovations", "Emerging fields", "Interdisciplinary solutions"]
  }
};

export default function Classification() {
  const { toast } = useToast();
  const [classificationResults, setClassificationResults] = useState<any>(null);

  const { data: patents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const form = useForm<ClassificationForm>({
    resolver: zodResolver(classificationSchema),
    defaultValues: {
      text: "",
      mode: "description",
    },
  });

  const classificationMutation = useMutation({
    mutationFn: async (data: ClassificationForm) => {
      const payload = {
        description: data.text,
        ...(data.mode === "patent_id" && data.patentId && { patentId: data.patentId }),
      };
      
      return aiAPI.classifyInnovation(payload);
    },
    onSuccess: (data) => {
      setClassificationResults(data);
      toast({
        title: "Classification Complete",
        description: "AI-powered patent classification has been completed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Classification Failed", 
        description: error.message || "Failed to classify patent content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClassificationForm) => {
    if (data.mode === "patent_id" && !data.patentId) {
      toast({
        title: "Patent Required",
        description: "Please select a patent when using patent mode.",
        variant: "destructive",
      });
      return;
    }
    classificationMutation.mutate(data);
  };

  const watchMode = form.watch("mode");

  if (!patents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Innovation Category Classification</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered classification of patent innovations into technology categories
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
        <h1 className="text-3xl font-bold">Innovation Category Classification</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered automatic categorization of patents into technology sectors with market insights and strategic recommendations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Patent Classification
            </CardTitle>
            <CardDescription>
              Analyze patent content to automatically determine the best technology category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classification Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select classification mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="description">Analyze Text Description</SelectItem>
                          <SelectItem value="patent_id">Classify Existing Patent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether to classify new text or an existing patent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchMode === "patent_id" && (
                  <FormField
                    control={form.control}
                    name="patentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Patent</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a patent to classify" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patents?.map((patent: any) => (
                              <SelectItem key={patent.id} value={patent.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span className="truncate">{patent.title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select from your existing patents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchMode === "description" && (
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Innovation Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your invention, including its purpose, functionality, technical details, and intended applications..."
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description for accurate classification
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  disabled={classificationMutation.isPending}
                  className="w-full"
                >
                  {classificationMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Classifying...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Classify Innovation
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Category Reference */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3 text-sm">Available Categories</h4>
              <div className="grid gap-2">
                {Object.entries(categoryInfo).slice(0, 4).map(([key, info]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${info.color.split(' ')[0]}`}></div>
                    <span className="text-xs">{info.label}</span>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-1">
                  +4 more categories
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          {classificationMutation.isPending ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <CardTitle>Analyzing Innovation...</CardTitle>
                </div>
                <CardDescription>
                  AI is performing deep analysis to determine the best technology category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Content Analysis</span>
                      <span>Processing...</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Keyword Extraction</span>
                      <span>In Progress...</span>
                    </div>
                    <Progress value={50} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Category Matching</span>
                      <span>Analyzing...</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Market Analysis</span>
                      <span>Pending...</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : classificationResults ? (
            <div className="space-y-6">
              {/* Primary Classification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tags className="h-5 w-5" />
                    Classification Results
                  </CardTitle>
                  <CardDescription>
                    AI-powered innovation category classification with confidence scoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Primary Category */}
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center p-6 rounded-full bg-primary/10">
                        <Tags className="h-12 w-12 text-primary" />
                      </div>
                      <div>
                        <Badge 
                          className={`text-lg px-4 py-2 ${categoryInfo[classificationResults.primaryCategory as keyof typeof categoryInfo]?.color}`}
                          variant="secondary"
                        >
                          {categoryInfo[classificationResults.primaryCategory as keyof typeof categoryInfo]?.label}
                        </Badge>
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">Confidence: </span>
                          <span className="font-semibold">
                            {(classificationResults.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={classificationResults.confidence * 100} className="w-48 mx-auto mt-2" />
                      </div>
                    </div>

                    <Separator />

                    {/* Category Description */}
                    <div className="space-y-2">
                      <h4 className="font-semibold">Category Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {categoryInfo[classificationResults.primaryCategory as keyof typeof categoryInfo]?.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {categoryInfo[classificationResults.primaryCategory as keyof typeof categoryInfo]?.examples.map((example: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Secondary Categories & Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Secondary Classifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {classificationResults.secondaryCategories && classificationResults.secondaryCategories.length > 0 ? (
                        classificationResults.secondaryCategories.map((category: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {categoryInfo[category.category as keyof typeof categoryInfo]?.label}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {(category.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={category.confidence * 100} className="h-2" />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No secondary categories identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Technologies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {classificationResults.keywords && classificationResults.keywords.length > 0 ? (
                          classificationResults.keywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No keywords identified</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        These key technologies were identified in your innovation description
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid gap-3">
                        {classificationResults.marketTrends ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Market Growth:</span>
                              <Badge variant={classificationResults.marketTrends.growth === "High" ? "default" : "secondary"}>
                                {classificationResults.marketTrends.growth || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Competition Level:</span>
                              <Badge variant="outline">
                                {classificationResults.marketTrends.competitiveness || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Patent Activity:</span>
                              <Badge variant="secondary">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {classificationResults.marketTrends.patentActivity || 'N/A'}
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Market insights not available</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Strategic Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {classificationResults.recommendations && classificationResults.recommendations.length > 0 ? (
                        classificationResults.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground">{rec}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No recommendations available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Tags className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Classify Innovation</h3>
                <p className="text-muted-foreground text-center">
                  Enter your innovation description or select an existing patent to get AI-powered category classification with market insights.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Classification Benefits */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" />
              AI-Powered Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced machine learning algorithms analyze technical content to accurately categorize innovations across multiple technology sectors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Market Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get insights into market trends, competition levels, and patent activity in your technology category to inform strategic decisions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Strategic Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive actionable recommendations for patent filing strategies, market positioning, and commercialization opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}