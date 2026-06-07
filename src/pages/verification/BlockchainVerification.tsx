import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { blockchainAPI, patentAPI, Patent } from "@/lib/apiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Link as LinkIcon,
  ExternalLink,
  Copy,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";

interface VerificationResult {
  verified: boolean;
  actualHash?: string;
  timestamp?: string;
  message: string;
}

export default function BlockchainVerification() {
  const [selectedPatentId, setSelectedPatentId] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { data: patents } = useQuery({
    queryKey: ["patents"],
    queryFn: () => patentAPI.getPatents(),
    retry: false,
  });

  const blockchainSecuredPatents = patents?.filter((patent: Patent) =>
    patent.blockchainTxHash
  ) || [];

  const handleVerifyPatent = async (patentId: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await blockchainAPI.verifyPatent(patentId) as any;
      setVerificationResult(result);

      if (result.verified) {
        toast({
          title: "Verification successful",
          description: "Patent integrity confirmed on Base blockchain.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: result.message || "Integrity check failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The value has been copied to your clipboard.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const selectedPatent = patents?.find((p: Patent) => p.id === selectedPatentId);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Blockchain Verification</h1>
        <p className="text-muted-foreground mt-2">
          Verify patent integrity and ownership using Base blockchain technology.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Interface */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2" size={20} />
                Verify Patent
              </CardTitle>
              <CardDescription>
                Select a patent to verify its blockchain integrity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Patent
                </label>
                <Select value={selectedPatentId} onValueChange={setSelectedPatentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patent" />
                  </SelectTrigger>
                  <SelectContent>
                    {blockchainSecuredPatents.map((patent: Patent) => (
                      <SelectItem key={patent.id} value={patent.id}>
                        {patent.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {blockchainSecuredPatents.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No blockchain-secured patents found. File a patent to get started.
                  </p>
                )}
              </div>

              <Button
                onClick={() => selectedPatentId && handleVerifyPatent(selectedPatentId)}
                disabled={!selectedPatentId || isVerifying}
                className="w-full bg-primary hover:bg-primary-dark"
              >
                {isVerifying ? (
                  <>
                    <Clock className="mr-2 animate-spin" size={16} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2" size={16} />
                    Verify on Blockchain
                  </>
                )}
              </Button>

              {/* Verification Result */}
              {verificationResult && (
                <div className={`p-4 rounded-lg ${verificationResult.verified
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${verificationResult.verified
                      ? 'bg-green-100'
                      : 'bg-red-100'
                      }`}>
                      {verificationResult.verified ? (
                        <CheckCircle className="text-green-600" size={16} />
                      ) : (
                        <XCircle className="text-red-600" size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className={`font-medium ${verificationResult.verified ? 'text-green-900' : 'text-red-900'
                        }`}>
                        {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                      </h4>
                      <p className={`text-sm mt-1 ${verificationResult.verified ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {verificationResult.message}
                      </p>
                      {verificationResult.timestamp && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Verified at: {formatDate(verificationResult.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blockchain Features */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fingerprint className="mr-2" size={20} />
                Security Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Immutable Base timestamps</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Cryptographic hashing (SHA-256)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Base Layer-2 consensus</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Global auditability</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patent Details & Blockchain Info */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatent ? (
            <>
              {/* Patent Information */}
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle>Patent Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <p className="text-sm text-foreground mt-1">{selectedPatent.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={
                          selectedPatent.status === 'approved' ? 'bg-green-100 text-green-800' :
                            selectedPatent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-muted text-muted-foreground'
                        }>
                          {selectedPatent.status.charAt(0).toUpperCase() + selectedPatent.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Patent ID</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {selectedPatent.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedPatent.id)}
                        >
                          <Copy size={14} />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm text-foreground mt-1">
                        {formatDate(selectedPatent.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Blockchain Details */}
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center">
                    <LinkIcon className="mr-2" size={20} />
                    Base Blockchain Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedPatent.blockchainTxHash ? (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all">
                            {selectedPatent.blockchainTxHash}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedPatent.blockchainTxHash!)}
                          >
                            <Copy size={14} />
                          </Button>
                          <a
                            href={`https://sepolia.basescan.org/tx/${selectedPatent.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink size={14} />
                            </Button>
                          </a>
                        </div>
                      </div>

                      {selectedPatent.networkName && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Network</label>
                          <div className="mt-1">
                            <Badge variant="outline" className="font-mono">
                              {selectedPatent.networkName.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {selectedPatent.hashValue && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">SHA-256 Content Hash</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all">
                              {selectedPatent.hashValue}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedPatent.hashValue!)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Shield className="text-green-600" size={16} />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Blockchain Secured</h4>
                            <p className="text-sm text-green-700">
                              This patent is permanently recorded on the Base blockchain with
                              cryptographic proof of existence and integrity.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="text-yellow-600" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-yellow-900 mb-1">Not Blockchain Secured</h4>
                          <p className="text-sm text-yellow-700 mb-3">
                            This patent has not been recorded on the blockchain yet.
                            Secure it now for immutable proof of existence.
                          </p>
                          <Button size="sm" className="bg-primary hover:bg-primary-dark">
                            Secure on Blockchain
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">Select a Patent</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a patent from the dropdown to view its blockchain verification details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
