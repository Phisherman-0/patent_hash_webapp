import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { aiAPI, patentAPI } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { clearUser } from "@/store/authSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Microscope, 
  Brain, 
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Zap,
} from "lucide-react";

const searchFormSchema = z.object({
  patentId: z.string().optional(),
  description: z.string().min(50, "Description must be at least 50 characters"),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface PriorArtResult {
  patentId: string;
  title: string;
  description: string;
  similarityScore: number;
  source: string;
}

interface Patent {
  id: string;
  title: string;
  description: string;
}

export default function PriorArtSearch() {
  const [searchResults, setSearchResults] = useState<PriorArtResult[]>([]);
  const { toast } = useToast();
  const dispatch = useAppDispatch();


  const { data: patents } = useQuery({
    queryKey: ["patents"],
    queryFn: () => patentAPI.getAll(),
    retry: false,
  });

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      description: "",
      patentId: "manual",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchFormValues) => {
      const payload = {
        description: data.description,
        ...(data.patentId && data.patentId !== "manual" && { patentId: data.patentId }),
      };
      
      return aiAPI.priorArtSearch(payload);
    },
    onSuccess: (results) => {
      setSearchResults(results);
      toast({
        title: "Prior art search completed",
        description: `Found ${results.length} potential prior art references.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SearchFormValues) => {
    searchMutation.mutate(data);
  };

  const getRiskLevel = (similarityScore: number) => {
    if (similarityScore >= 0.8) return { level: "High", color: "bg-red-100 text-red-800" };
    if (similarityScore >= 0.6) return { level: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { level: "Low", color: "bg-green-100 text-green-800" };
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'internal':
        return <FileText size={16} className="text-blue-600" />;
      case 'uspto':
        return <ExternalLink size={16} className="text-green-600" />;
      case 'epo':
        return <ExternalLink size={16} className="text-purple-600" />;
      default:
        return <ExternalLink size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Prior Art Search</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered search across global patent databases to identify similar inventions and potential conflicts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Microscope className="mr-2" size={20} />
                Search Configuration
              </CardTitle>
              <CardDescription>
                Enter your invention details to search for prior art
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
                        <FormLabel>Search for Patent (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a patent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual description</SelectItem>
                            {patents?.map((patent: Patent) => (
                              <SelectItem key={patent.id} value={patent.id}>
                                {patent.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose an existing patent or enter description manually
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invention Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your invention in detail, including technical features, functionality, and innovative aspects..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a comprehensive description for better search results
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={searchMutation.isPending}
                    className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                  >
                    {searchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2" size={16} />
                        Search Prior Art
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2" size={20} />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Semantic similarity analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Multi-database search</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Relevance scoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Risk assessment</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle>Search Results</CardTitle>
                {searchResults.length > 0 && (
                  <Badge variant="secondary">
                    {searchResults.length} results found
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {searchMutation.isPending ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Searching prior art...</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      AI is analyzing global patent databases
                    </p>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Microscope className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No search results</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter your invention description and click search to find prior art.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Zap className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Search Summary</h4>
                        <p className="text-sm text-gray-700">
                          Found {searchResults.length} potential prior art references. 
                          {searchResults.filter(r => r.similarityScore >= 0.8).length > 0 && (
                            ` ${searchResults.filter(r => r.similarityScore >= 0.8).length} high-risk similarities detected.`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Results List */}
                  <div className="space-y-4">
                    {searchResults.map((result, index) => {
                      const risk = getRiskLevel(result.similarityScore);
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getSourceIcon(result.source)}
                              <div>
                                <h3 className="font-semibold text-foreground">{result.title}</h3>
                                <p className="text-sm text-gray-500">
                                  {result.patentId} • {result.source}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="secondary" className="text-xs">
                                {result.source}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Similarity:</span>
                                <div className="text-sm font-medium text-gray-900">
                                  {(result.similarityScore * 100).toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">similarity</div>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {result.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Progress 
                              value={result.similarityScore * 100} 
                              className="flex-1 mr-4"
                            />
                            <Button variant="outline" size="sm">
                              <ExternalLink className="mr-2" size={14} />
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button variant="outline">
                      <FileText className="mr-2" size={16} />
                      Export Report
                    </Button>
                    <Button>
                      <CheckCircle className="mr-2" size={16} />
                      Save Analysis
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
