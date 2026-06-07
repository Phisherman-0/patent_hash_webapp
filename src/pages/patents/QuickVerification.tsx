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
import { blockchainAPI, searchAPI, patentAPI, type Patent } from "@/lib/apiService";
import { Search, Shield, CheckCircle, AlertCircle, ExternalLink, Calendar, User } from "lucide-react";

const verificationSchema = z.object({
  type: z.enum(["patent_id", "blockchain_tx"]),
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
      } else {
        // Search by TX hash (mock/simple implementation)
        const response = await searchAPI.searchPatents(data.value);
        return { type: 'search', data: response };
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
      case "blockchain_tx":
        return "Blockchain Transaction Hash";
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

    const { type, data } = verificationResults;

    if (type === 'blockchain') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Blockchain Verification Results
            </CardTitle>
            <CardDescription>
              Patent integrity verification on Base blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                      ? "Patent hash verified on Base blockchain"
                      : data.message || "Patent hash could not be verified"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <p className="text-sm font-medium">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono bg-muted p-2 rounded flex-1 break-all">
                      {data.blockchainTxHash || "N/A"}
                    </p>
                    {data.blockchainTxHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${data.blockchainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <p className="text-sm font-medium">Content Hash (SHA-256)</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                    {data.actualHash || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Timestamp</p>
                  <p className="text-sm text-muted-foreground">
                    {data.timestamp ? formatDate(data.timestamp) : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Network</p>
                  <Badge variant="outline">Base Sepolia</Badge>
                </div>
              </div>

              {data.verified && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ Patent Authenticity Confirmed
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    This patent has been cryptographically verified on the Base blockchain.
                    The hash integrity is intact and permanently recorded.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (type === 'search') {
      const results = Array.isArray(data) ? data : [];
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Search Results
            </CardTitle>
            <CardDescription>
              Found {results.length} patent(s) matching your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((patent: Patent) => (
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

                        <p className="text-sm line-clamp-2">
                          {patent.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {patent.createdAt ? formatDate(patent.createdAt) : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Registered User
                          </span>
                        </div>

                        {patent.blockchainTxHash && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded flex items-center justify-between">
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-mono truncate mr-2">
                              🔗 Base Secured: {patent.blockchainTxHash}
                            </p>
                            <a
                              href={`https://sepolia.basescan.org/tx/${patent.blockchainTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={12} className="text-blue-600" />
                            </a>
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
                <p className="text-sm text-muted-foreground">No patents found matching your criteria</p>
              </div>
            )}
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
            Instantly verify patent authenticity and ownership using Base blockchain.
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
          Instantly verify patent authenticity, ownership, and integrity using Base blockchain technology.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verify Patent
            </CardTitle>
            <CardDescription>
              Select verification method and enter identifier
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
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="patent_id">Patent ID</SelectItem>
                          <SelectItem value="blockchain_tx">Transaction Hash</SelectItem>
                        </SelectContent>
                      </Select>
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
                            form.watch("type") === "patent_id" ? "Enter patent UUID..." :
                              "Enter transaction hash..."
                          }
                          {...field}
                        />
                      </FormControl>
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
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {verificationResults ? (
            renderVerificationResults()
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Verify</h3>
                <p className="text-muted-foreground text-center">
                  Use the form to instantly verify patent records on the Base blockchain.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}