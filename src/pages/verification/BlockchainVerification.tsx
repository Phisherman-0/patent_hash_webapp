import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { blockchainAPI, patentAPI } from "@/lib/apiService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Hash,
  Link as LinkIcon,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Copy,
  AlertTriangle,
  Fingerprint,
} from "lucide-react";

interface Patent {
  id: string;
  title: string;
  status: string;
  hederaTopicId?: string;
  hederaMessageId?: string;
  hederaNftId?: string;
  hashValue?: string;
  createdAt: string;
  filedAt?: string;
}

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
    patent.hederaTopicId && patent.hederaMessageId
  ) || [];

  const handleVerifyPatent = async (patentId: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await blockchainAPI.verifyPatent(patentId);
      setVerificationResult(result);

      if (result.verified) {
        toast({
          title: "Verification successful",
          description: "Patent integrity confirmed on blockchain.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: result.message,
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
        <h1 className="text-3xl font-bold text-gray-900">Blockchain Verification</h1>
        <p className="text-gray-600 mt-2">
          Verify patent integrity and ownership using Hedera blockchain technology.
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                  <p className="text-sm text-gray-500 mt-2">
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
                <div className={`p-4 rounded-lg ${
                  verificationResult.verified 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      verificationResult.verified 
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
                      <h4 className={`font-medium ${
                        verificationResult.verified ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        verificationResult.verified ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {verificationResult.message}
                      </p>
                      {verificationResult.timestamp && (
                        <p className="text-xs text-gray-500 mt-2">
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
                <span className="text-sm">Immutable timestamps</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Cryptographic hashing</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Distributed consensus</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Global verification</span>
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
                <CardHeader className="border-b border-gray-200">
                  <CardTitle>Patent Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedPatent.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        <Badge className={
                          selectedPatent.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedPatent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {selectedPatent.status.charAt(0).toUpperCase() + selectedPatent.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Patent ID</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
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
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedPatent.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Blockchain Details */}
              <Card>
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="flex items-center">
                    <LinkIcon className="mr-2" size={20} />
                    Blockchain Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedPatent.hederaTopicId ? (
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Hedera Topic ID</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {selectedPatent.hederaTopicId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedPatent.hederaTopicId!)}
                          >
                            <Copy size={14} />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </div>

                      {selectedPatent.hederaMessageId && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Message ID</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {selectedPatent.hederaMessageId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedPatent.hederaMessageId!)}
                            >
                              <Copy size={14} />
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedPatent.hashValue && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">SHA-256 Hash</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono break-all">
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

                      {selectedPatent.hederaNftId && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">NFT Token ID</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                              {selectedPatent.hederaNftId}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedPatent.hederaNftId!)}
                            >
                              <Copy size={14} />
                            </Button>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              NFT
                            </Badge>
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
                              This patent is permanently recorded on the Hedera blockchain with 
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
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Patent</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a patent from the dropdown to view its blockchain verification details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Blockchain Secured Patents List */}
      {blockchainSecuredPatents.length > 0 && (
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle>Blockchain Secured Patents</CardTitle>
            <CardDescription>
              All your patents that are secured on the Hedera blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {blockchainSecuredPatents.map((patent: Patent) => (
                <div key={patent.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="text-green-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{patent.title}</h4>
                      <p className="text-sm text-gray-500">
                        Topic: {patent.hederaTopicId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {patent.hederaNftId && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        NFT
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-800">
                      Secured
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatentId(patent.id);
                        handleVerifyPatent(patent.id);
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
