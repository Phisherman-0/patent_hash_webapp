import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { patentAPI } from "@/lib/apiService";
import { useQueryClient } from "@tanstack/react-query";
import { Award, Download, Share2, QrCode, Shield, FileText, RefreshCw, CheckCircle, ExternalLink } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PatentCertificates() {
  const { toast } = useToast();

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const queryClient = useQueryClient();

  const generateCertificateMutation = useMutation({
    mutationFn: async (patentId: string) => {
      // Mock certificate generation - in real implementation, this would generate a blockchain certificate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        certificateId: `CERT-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        qrCode: `data:image/svg+xml;base64,${btoa(`
          <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="white"/>
            <rect x="10" y="10" width="80" height="80" fill="black"/>
          </svg>
        `)}`,
        verificationUrl: `https://verify.patenthash.com/cert/${patentId}`,
      };
    },
    onSuccess: () => {
      toast({
        title: "Certificate Generated",
        description: "Patent certificate has been generated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['patents'] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate certificate. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadCertificate = async (patent: any) => {
    try {
      const certificateElement = document.getElementById(`certificate-${patent.id}`);
      if (!certificateElement) {
        toast({
          title: "Error",
          description: "Please open the certificate view first before downloading.",
          variant: "destructive",
        });
        return;
      }

      // Create canvas from the certificate element with optimized settings
      const canvas = await html2canvas(certificateElement, {
        scale: 1.5, // Reduced from 2 to decrease file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: certificateElement.scrollWidth,
        height: certificateElement.scrollHeight,
      });

      // Create PDF with compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable compression
      });

      // Convert to JPEG with compression instead of PNG
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`patent_certificate_${patent.id}.pdf`);

      toast({
        title: "Certificate Downloaded",
        description: "Patent certificate PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareCertificate = async (patent: any) => {
    const shareData = {
      title: `Patent Certificate - ${patent.title}`,
      text: `Verified patent certificate for "${patent.title}" on Patent Hash blockchain platform.`,
      url: `https://verify.patenthash.com/cert/${patent.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Certificate Shared",
          description: "Patent certificate link has been shared successfully.",
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link Copied",
        description: "Certificate verification link has been copied to clipboard.",
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "under_review": return "outline";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  if (loadingPatents) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Patent Certificates</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage blockchain-verified patent certificates
          </p>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patent Certificates</h1>
        <p className="text-muted-foreground mt-2">
          Generate blockchain-verified certificates for your patents with QR codes and verification links for global authentication
        </p>
      </div>

      {/* Certificates Grid */}
      <div className="grid gap-6">
        {patents && patents.length > 0 ? (
          patents.map((patent: any) => (
            <Card key={patent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      {patent.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Patent ID: {patent.id} • Created: {formatDate(patent.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(patent.status)}>
                    {patent.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Patent Info */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <p className="text-sm">{patent.category?.replace('_', ' ') || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Blockchain Status</p>
                      <div className="flex items-center gap-2">
                        {patent.hederaTopicId ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Estimated Value</p>
                      <p className="text-sm">
                        {patent.estimatedValue 
                          ? `$${parseFloat(patent.estimatedValue).toLocaleString()}` 
                          : 'Not valuated'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Patent Certificate</DialogTitle>
                          <DialogDescription>
                            Blockchain-verified certificate for {patent.title}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {/* Certificate Content */}
                        <div id={`certificate-${patent.id}`} className="bg-white text-black min-h-[800px] p-8 space-y-8" style={{fontFamily: 'serif'}}>
                          {/* Decorative Border */}
                          <div className="absolute inset-4 border-4 border-orange-400 rounded-lg"></div>
                          <div className="absolute inset-6 border-2 border-orange-300 rounded-lg"></div>
                          
                          {/* Certificate Header */}
                          <div className="relative text-center space-y-6 pt-8">
                            {/* Official Seal */}
                            <div className="flex justify-center mb-6">
                              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-orange-300 relative">
                                <Award className="h-12 w-12 text-white" />
                                <div className="absolute inset-2 border-2 border-orange-200 rounded-full"></div>
                              </div>
                            </div>
                            
                            {/* Certificate Title */}
                            <div className="space-y-2">
                              <h1 className="text-4xl font-bold text-orange-800 tracking-wider" style={{fontFamily: 'serif'}}>
                                CERTIFICATE OF PATENT
                              </h1>
                              <div className="w-32 h-1 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto"></div>
                              <p className="text-lg text-orange-700 font-semibold tracking-wide">
                                BLOCKCHAIN VERIFICATION AUTHORITY
                              </p>
                              <p className="text-sm text-gray-600 uppercase tracking-widest">
                                Hedera Hashgraph Network • Patent Hash Platform
                              </p>
                            </div>
                          </div>

                          {/* Official Declaration */}
                          <div className="relative text-center space-y-4 px-12">
                            <p className="text-lg text-gray-800 leading-relaxed" style={{fontFamily: 'serif'}}>
                              <em>This is to certify that the invention described herein has been duly registered and verified on the blockchain network, 
                              establishing immutable proof of intellectual property rights and timestamp of creation.</em>
                            </p>
                          </div>

                          {/* Patent Details Section */}
                          <div className="relative bg-orange-50 border-l-4 border-orange-500 p-8 mx-4">
                            <div className="text-center mb-6">
                              <h2 className="text-2xl font-bold text-orange-800 mb-2" style={{fontFamily: 'serif'}}>
                                PATENT SPECIFICATION
                              </h2>
                              <div className="w-24 h-0.5 bg-orange-500 mx-auto"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Left Column */}
                              <div className="space-y-4">
                                <div className="border-b border-orange-200 pb-2">
                                  <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Patent Title</span>
                                  <p className="text-lg font-bold text-gray-800 mt-1" style={{fontFamily: 'serif'}}>{patent.title}</p>
                                </div>
                                
                                <div className="border-b border-orange-200 pb-2">
                                  <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Patent Number</span>
                                  <p className="text-base font-mono text-gray-800 mt-1">US-BLK-{patent.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                                
                                <div className="border-b border-orange-200 pb-2">
                                  <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Classification</span>
                                  <p className="text-base text-gray-800 mt-1 capitalize">{patent.category?.replace('_', ' ') || 'General Technology'}</p>
                                </div>
                                
                                <div className="border-b border-orange-200 pb-2">
                                  <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Filing Date</span>
                                  <p className="text-base text-gray-800 mt-1">{new Date(patent.createdAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}</p>
                                </div>
                              </div>

                              {/* Right Column */}
                              <div className="space-y-4">
                                <div className="text-center">
                                  <div className="w-32 h-32 bg-white border-4 border-orange-300 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <QrCode className="h-16 w-16 text-orange-500" />
                                  </div>
                                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Blockchain Verification</p>
                                  <p className="text-xs text-gray-600 mt-1">Scan for instant verification</p>
                                </div>
                                
                                <div className="bg-white p-4 rounded border border-orange-200">
                                  <h4 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wide">Blockchain Registry</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Network:</span>
                                      <span className="font-mono">Hedera Hashgraph</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Topic ID:</span>
                                      <span className="font-mono">{patent.hederaTopicId || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">NFT Token:</span>
                                      <span className="font-mono">{patent.hederaNftId ? 'Minted' : 'Available'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Hash:</span>
                                      <span className="font-mono text-xs">{patent.hashValue?.substring(0, 16) || 'Processing'}...</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Authority Section */}
                          <div className="relative px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                              {/* Digital Signature */}
                              <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                  <Shield className="h-10 w-10 text-white" />
                                </div>
                                <div className="border-t-2 border-gray-800 pt-2 mt-4">
                                  <p className="text-sm font-bold text-gray-800">Digital Authority</p>
                                  <p className="text-xs text-gray-600">Blockchain Verified</p>
                                </div>
                              </div>

                              {/* Certificate Validity */}
                              <div className="text-center">
                                <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4">
                                  <h3 className="text-lg font-bold text-orange-800 mb-2" style={{fontFamily: 'serif'}}>
                                    CERTIFICATE VALIDITY
                                  </h3>
                                  <div className="space-y-1 text-sm text-gray-700">
                                    <p><strong>Issue Date:</strong> {new Date().toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}</p>
                                    <p><strong>Certificate No:</strong> CERT-{patent.id.substring(0, 8).toUpperCase()}</p>
                                    <p><strong>Valid Until:</strong> <span className="text-green-700 font-semibold">Perpetual</span></p>
                                    <p><strong>Jurisdiction:</strong> Global Blockchain Registry</p>
                                  </div>
                                </div>
                              </div>

                              {/* Official Seal */}
                              <div className="text-center">
                                <div className="w-20 h-20 border-4 border-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 bg-white shadow-lg relative">
                                  <div className="text-center">
                                    <div className="text-xs font-bold text-orange-800">OFFICIAL</div>
                                    <div className="text-xs font-bold text-orange-800">SEAL</div>
                                  </div>
                                  <div className="absolute inset-1 border-2 border-orange-300 rounded-full"></div>
                                </div>
                                <div className="border-t-2 border-gray-800 pt-2 mt-4">
                                  <p className="text-sm font-bold text-gray-800">Patent Hash Authority</p>
                                  <p className="text-xs text-gray-600">Blockchain Registry</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Legal Footer */}
                          <div className="relative bg-gray-50 border-t-2 border-orange-400 p-6 mx-4">
                            <div className="text-center space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <Shield className="h-4 w-4 text-orange-600" />
                                <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Legal Notice & Verification</span>
                              </div>
                              
                              <p className="text-xs text-gray-700 leading-relaxed max-w-4xl mx-auto" style={{fontFamily: 'serif'}}>
                                This certificate constitutes official recognition of the patent registration on the Hedera Hashgraph blockchain network. 
                                The cryptographic hash and distributed ledger technology provide immutable proof of the invention's timestamp and ownership. 
                                This document serves as legal evidence of intellectual property rights and may be used in legal proceedings. 
                                Verification can be performed independently through the blockchain network using the provided identifiers.
                              </p>
                              
                              <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-300">
                                <div className="text-center">
                                  <p className="text-xs font-semibold text-gray-600">Verification URL</p>
                                  <p className="text-xs font-mono text-orange-700">verify.patenthash.com/cert/{patent.id.substring(0, 8)}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-semibold text-gray-600">Blockchain Network</p>
                                  <p className="text-xs text-gray-700">Hedera Hashgraph Mainnet</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-semibold text-gray-600">Registry Authority</p>
                                  <p className="text-xs text-gray-700">Patent Hash Platform</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-center gap-3 pt-4 pb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-white"
                              onClick={() => downloadCertificate(patent)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-white"
                              onClick={() => shareCertificate(patent)}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50 bg-white"
                              onClick={() => window.open(`https://verify.patenthash.com/cert/${patent.id}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Verify Online
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      onClick={() => downloadCertificate(patent)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => shareCertificate(patent)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>

                    {!patent.hederaTopicId && (
                      <Button
                        variant="outline"
                        onClick={() => generateCertificateMutation.mutate(patent.id)}
                        disabled={generateCertificateMutation.isPending}
                      >
                        {generateCertificateMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="h-4 w-4 mr-2" />
                        )}
                        Generate Certificate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Award className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Patents for Certificates</h3>
              <p className="text-muted-foreground text-center">
                File your first patent to generate blockchain-verified certificates with global verification capabilities.
              </p>
              <Button className="mt-4">
                <FileText className="h-4 w-4 mr-2" />
                File Your First Patent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Certificate Features */}
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
              Certificates are secured by Hedera blockchain technology with cryptographic verification and immutable timestamps.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" />
              QR Code Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each certificate includes a QR code for instant verification by scanning with any smartphone or QR reader.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              Global Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Certificates can be verified globally by anyone using the verification URL and are recognized internationally.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}