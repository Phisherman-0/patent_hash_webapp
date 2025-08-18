import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { patentAPI } from "@/lib/apiService";
import { UserCheck, Shield, CheckCircle, AlertCircle, Search, FileText, Calendar, Hash, ExternalLink } from "lucide-react";

const verificationSchema = z.object({
  verificationMethod: z.enum(["patent_id", "nft_id", "transaction_id"]),
  identifier: z.string().min(1, "Please enter an identifier"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

export default function OwnershipVerification() {
  const { toast } = useToast();
  const [verificationResults, setVerificationResults] = useState<any>(null);

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      verificationMethod: "patent_id",
      identifier: "",
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      return patentAPI.verifyOwnership(data);
    },
    onSuccess: (data) => {
      setVerificationResults(data);
      toast({
        title: "Verification Complete",
        description: `Ownership verification completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify ownership. Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VerificationForm) => {
    verificationMutation.mutate(data);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "patent_id": return "Patent ID";
      case "nft_id": return "NFT ID";
      case "transaction_id": return "Transaction ID";
      default: return "Unknown";
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

  if (loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Ownership Verification</h1>
          <p className="text-muted-foreground mt-2">
            Verify patent ownership and transfer history on the blockchain
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
        <h1 className="text-3xl font-bold">Ownership Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify patent ownership, transfer history, and licensing terms using blockchain technology and NFT records
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Verification Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verify Ownership
            </CardTitle>
            <CardDescription>
              Enter patent or NFT identifier to verify ownership on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="verificationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Method</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="patent_id">Patent ID</option>
                          <option value="nft_id">NFT ID</option>
                          <option value="transaction_id">Transaction ID</option>
                        </select>
                      </FormControl>
                      <FormDescription>
                        Choose how you want to verify ownership
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {getMethodLabel(form.watch("verificationMethod"))}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={
                            form.watch("verificationMethod") === "patent_id" ? "Enter patent ID..." :
                            form.watch("verificationMethod") === "nft_id" ? "Enter NFT ID (e.g., 0.0.123456)..." :
                            "Enter transaction ID..."
                          }
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("verificationMethod") === "patent_id" && "Use your patent ID for ownership verification"}
                        {form.watch("verificationMethod") === "nft_id" && "Use the Hedera NFT ID associated with the patent"}
                        {form.watch("verificationMethod") === "transaction_id" && "Use a blockchain transaction ID"}
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
                  {verificationMutation.isPending ? "Verifying Ownership..." : "Verify Ownership"}
                </Button>
              </form>
            </Form>

            {/* Quick Access */}
            {patents && patents.length > 0 && (
              <div className="mt-6">
                <Separator className="mb-4" />
                <h4 className="text-sm font-medium mb-3">Quick Verify - Your Patents</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {patents.slice(0, 3).map((patent: any) => (
                    <Button
                      key={patent.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto p-2"
                      onClick={() => {
                        form.setValue("verificationMethod", "patent_id");
                        form.setValue("identifier", patent.id);
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

        {/* Verification Results */}
        <div className="lg:col-span-2">
          {verificationMutation.isPending ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 animate-pulse" />
                  <CardTitle>Verifying Ownership...</CardTitle>
                </div>
                <CardDescription>
                  Checking blockchain records and NFT ownership data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Querying Hedera blockchain...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Verifying NFT ownership...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Checking transfer history...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : verificationResults ? (
            <div className="space-y-6">
              {/* Ownership Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Ownership Verification Results
                  </CardTitle>
                  <CardDescription>
                    Blockchain-verified ownership information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Verification Status */}
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong className="text-green-600">Ownership Verified:</strong> The patent ownership has been successfully verified on the Hedera blockchain.
                      </AlertDescription>
                    </Alert>

                    {/* Owner Information */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Current Owner</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Name:</span>
                            <span className="text-sm">{verificationResults.owner.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Email:</span>
                            <span className="text-sm">{verificationResults.owner.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Owner ID:</span>
                            <span className="text-sm font-mono">{verificationResults.owner.id}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant="outline" className="text-green-600">
                              {verificationResults.ownership.original ? "Original Owner" : "Current Owner"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Patent Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Title:</span>
                            <span className="text-sm truncate">{verificationResults.patent.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant="secondary">{verificationResults.patent.status}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Created:</span>
                            <span className="text-sm">{formatDate(verificationResults.patent.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Royalties:</span>
                            <span className="text-sm">{verificationResults.ownership.royalties}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Blockchain Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Blockchain Verification Details</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Network:</span>
                            <Badge variant="outline">{verificationResults.blockchain.network}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">NFT ID:</span>
                            <span className="text-sm font-mono">{verificationResults.patent.hederaNftId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Topic ID:</span>
                            <span className="text-sm font-mono">{verificationResults.patent.hederaTopicId}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Transaction ID:</span>
                            <span className="text-sm font-mono break-all">{verificationResults.blockchain.transactionId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Consensus:</span>
                            <Badge variant="outline" className="text-green-600">
                              {verificationResults.blockchain.consensus}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Gas Used:</span>
                            <span className="text-sm">{verificationResults.blockchain.gasUsed} ℏ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Transfer History
                  </CardTitle>
                  <CardDescription>
                    Complete ownership and transfer history from the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {verificationResults.ownership.transferHistory.length > 0 ? (
                    <div className="space-y-4">
                      {verificationResults.ownership.transferHistory.map((transfer: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{transfer.type}</p>
                              <p className="text-sm text-muted-foreground">
                                From: {transfer.from} → To: {transfer.to}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{formatDate(transfer.timestamp)}</p>
                              <Badge variant="outline">{transfer.status}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transfers</h3>
                      <p className="text-muted-foreground">
                        This patent has never been transferred and remains with the original owner.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Verify Ownership</h3>
                <p className="text-muted-foreground text-center">
                  Enter a patent ID, NFT ID, or transaction ID to verify ownership and view complete transfer history on the blockchain.
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
              Ownership verification is cryptographically secured using Hedera blockchain and NFT technology for tamper-proof records.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Complete History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View complete ownership and transfer history with timestamps, transaction details, and verification status.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              Global Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ownership verification is globally accessible and can be independently verified by any party using blockchain explorers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}