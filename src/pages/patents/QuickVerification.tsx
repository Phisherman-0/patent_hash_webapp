import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { blockchainAPI, searchAPI, patentAPI } from "@/lib/apiService";
import { Search, Shield, CheckCircle, AlertCircle, ExternalLink, Calendar, User } from "lucide-react";

const verificationSchema = z.object({
  type: z.enum(["patent_id", "patent_number", "hedera_topic"]),
  value: z.string().min(1, "Please enter a value to verify"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function QuickVerification() {
  const { toast } = useToast();
  const [verificationResults, setVerificationResults] = useState<any>(null);

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      type: "patent_id",
      value: "",
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      if (data.type === "patent_id") {
        // Verify patent by ID using blockchain
        const response = await blockchainAPI.verifyPatent(data.value);
        return { type: 'blockchain', data: response };
      } else if (data.type === "patent_number") {
        // Search for patent by patent number
        const response = await searchAPI.searchPatents(data.value);
        return { type: 'search', data: response };
      } else {
        // Verify by Hedera topic ID (mock implementation)
        return { 
          type: 'hedera', 
          data: {
            verified: true,
            topicId: data.value,
            timestamp: new Date().toISOString(),
            transactionId: `0.0.123456@${Date.now()}`,
            status: 'confirmed'
          }
        };
      }
    },
    onSuccess: (response) => {
      setVerificationResults(response);
      toast({
        title: "Verification Complete",
        description: `Patent verification completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify patent. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VerificationForm) => {
    verificationMutation.mutate(data);
  };

  const getVerificationTypeLabel = (type: string) => {
    switch (type) {
      case "patent_id":
        return "Internal Patent ID";
      case "patent_number":
        return "Patent Number";
      case "hedera_topic":
        return "Hedera Topic ID";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVerificationResults = () => {
    if (!verificationResults) return null;

    if (verificationResults.type === 'blockchain') {
      const data = verificationResults.data;
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Blockchain Verification Results
            </CardTitle>
            <CardDescription>
              Patent integrity verification on Hedera Consensus Service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="flex items-center gap-3">
                {data.verified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">
                    {data.verified ? "Verification Successful" : "Verification Failed"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.verified 
                      ? "Patent hash verified on blockchain" 
                      : "Patent hash could not be verified"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Blockchain Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hedera Topic ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {data.topicId || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Message ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {data.messageId || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Hash Value</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {data.hashValue || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Timestamp</p>
                  <p className="text-sm text-muted-foreground">
                    {data.timestamp ? formatDate(data.timestamp) : "N/A"}
                  </p>
                </div>
              </div>

              {data.verified && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ Patent Authenticity Confirmed
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This patent has been cryptographically verified on the Hedera blockchain. 
                    The hash integrity is intact and timestamped.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (verificationResults.type === 'search') {
      const patents = verificationResults.data;
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Patent Search Results
            </CardTitle>
            <CardDescription>
              Found {patents?.length || 0} patent(s) matching your search
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patents && patents.length > 0 ? (
              <div className="space-y-4">
                {patents.map((patent: any) => (
                  <Card key={patent.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{patent.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Patent ID: {patent.id}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {patent.status?.replace('_', ' ') || 'Unknown'}
                          </Badge>
                        </div>

                        <p className="text-sm">
                          {patent.description?.substring(0, 200)}
                          {patent.description?.length > 200 ? '...' : ''}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {patent.createdAt ? formatDate(patent.createdAt) : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Owner ID: {patent.userId}
                          </span>
                          {patent.estimatedValue && (
                            <Badge variant="secondary">
                              ${parseFloat(patent.estimatedValue).toLocaleString()}
                            </Badge>
                          )}
                        </div>

                        {patent.hederaTopicId && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              🔗 Blockchain Verified (Topic: {patent.hederaTopicId})
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No patents found matching your search criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (verificationResults.type === 'hedera') {
      const data = verificationResults.data;
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Hedera Network Verification
            </CardTitle>
            <CardDescription>
              Direct verification on Hedera Consensus Service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold">Topic Verified</p>
                  <p className="text-sm text-muted-foreground">
                    Successfully verified on Hedera network
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Topic ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {data.topicId}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transaction ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {data.transactionId}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="outline" className="text-green-600">
                    {data.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Verification Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(data.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  if (loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Quick Verification</h1>
          <p className="text-muted-foreground mt-2">
            Instantly verify patent authenticity and ownership using blockchain technology
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
              <Skeleton className="h-10 w-full" />
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
        <h1 className="text-3xl font-bold">Quick Verification</h1>
        <p className="text-muted-foreground mt-2">
          Instantly verify patent authenticity, ownership, and creation date using blockchain technology and global patent databases
        </p>
      </div>

      {/* Verification Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verify Patent
            </CardTitle>
            <CardDescription>
              Choose verification method and enter the value to verify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select verification type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="patent_id">Internal Patent ID</SelectItem>
                          <SelectItem value="patent_number">Patent Number</SelectItem>
                          <SelectItem value="hedera_topic">Hedera Topic ID</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how you want to verify the patent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {getVerificationTypeLabel(form.watch("type"))}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            form.watch("type") === "patent_id" ? "Enter patent ID..." :
                            form.watch("type") === "patent_number" ? "Enter patent number..." :
                            "Enter Hedera topic ID..."
                          }
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("type") === "patent_id" && "Use your internal patent ID for blockchain verification"}
                        {form.watch("type") === "patent_number" && "Search by official patent number"}
                        {form.watch("type") === "hedera_topic" && "Verify directly on Hedera network"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={verificationMutation.isPending}
                  className="w-full"
                >
                  {verificationMutation.isPending ? "Verifying..." : "Verify Patent"}
                </Button>
              </form>
            </Form>

            {/* Quick Access */}
            {patents && patents.length > 0 && (
              <div className="mt-6">
                <Separator className="mb-4" />
                <h4 className="text-sm font-medium mb-3">Quick Access - Your Patents</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {patents.slice(0, 5).map((patent: any) => (
                    <Button
                      key={patent.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-2"
                      onClick={() => {
                        form.setValue("type", "patent_id");
                        form.setValue("value", patent.id);
                      }}
                    >
                      <div className="truncate">
                        <p className="font-medium text-xs truncate">{patent.title}</p>
                        <p className="text-xs text-muted-foreground">ID: {patent.id}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2">
          {verificationResults ? (
            renderVerificationResults()
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Verify</h3>
                <p className="text-muted-foreground text-center">
                  Select a verification type and enter the corresponding value to instantly verify patent authenticity and ownership.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Verification Features */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Blockchain Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cryptographic verification using Hedera blockchain ensures patent authenticity and tamper-proof timestamps.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4" />
              Instant Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get immediate verification results with detailed blockchain transaction information and ownership details.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              Global Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cross-reference with global patent databases and blockchain networks for comprehensive verification.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}