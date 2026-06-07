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
import { patentAPI, type Patent } from "@/lib/apiService";
import { UserCheck, Shield, CheckCircle, Search, FileText, ExternalLink } from "lucide-react";

const verificationSchema = z.object({
  verificationMethod: z.enum(["patent_id", "transaction_hash"]),
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
      // For now, we simulate the detailed ownership data 
      // but use the real patent API for basic verification
      const response = await patentAPI.verifyOwnership({
        verificationMethod: data.verificationMethod,
        identifier: data.identifier
      });
      return response;
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
      case "transaction_hash": return "Transaction Hash";
      default: return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loadingPatents) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ownership Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify patent ownership and registration history on the Base blockchain.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verify Ownership
            </CardTitle>
            <CardDescription>
              Enter patent ID or transaction hash to verify records
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="patent_id">Patent ID</SelectItem>
                          <SelectItem value="transaction_hash">Transaction Hash</SelectItem>
                        </SelectContent>
                      </Select>
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
                          placeholder="Enter identifier..."
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
                  {verificationMutation.isPending ? "Verifying..." : "Verify Ownership"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {verificationResults ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Ownership Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Record Found:</strong> The patent registration has been verified on the Base blockchain.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Owner Details</h4>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{verificationResults.owner?.name || "System Record"}</p>
                          <p className="text-xs text-muted-foreground">{verificationResults.owner?.email || "No email provided"}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">Patent Info</h4>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{verificationResults.patent?.title}</p>
                          <Badge variant="outline" className="mt-1">{verificationResults.patent?.status}</Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Blockchain Record</h4>
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Network</span>
                          <span>Base Sepolia</span>
                        </div>
                        {verificationResults.patent?.blockchainTxHash && (
                          <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Transaction Hash</span>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-mono break-all flex-1">{verificationResults.patent.blockchainTxHash}</p>
                              <a
                                href={`https://sepolia.basescan.org/tx/${verificationResults.patent.blockchainTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center py-20 text-center">
              <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">Start Verification</h3>
              <p className="text-muted-foreground max-w-sm px-6">
                Enter an identifier on the left to pull real-time registration data from the Base blockchain.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}