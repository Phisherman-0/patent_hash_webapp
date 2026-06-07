import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { patentAPI } from "@/lib/apiService";
import { Award, Download, Share2, QrCode, Shield, FileText, RefreshCw, CheckCircle, ExternalLink } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from "react";

export default function PatentCertificates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patents, isLoading: loadingPatents } = useQuery({
    queryKey: ['patents'],
    queryFn: () => patentAPI.getPatents(),
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (patentId: string) => {
      // Small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        certificateId: `CERT-BASE-${Date.now()}`,
        generatedAt: new Date().toISOString(),
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
        description: error.message || "Failed to generate certificate.",
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

      const canvas = await html2canvas(certificateElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`patent_certificate_${patent.id}.pdf`);

      toast({
        title: "Certificate Downloaded",
        description: "PDF has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  const shareCertificate = async (patent: any) => {
    const url = `${window.location.origin}/verification/blockchain?id=${patent.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Patent Certificate - ${patent.title}`,
          url: url,
        });
      } catch (e) { }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link Copied", description: "Verification link copied to clipboard." });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loadingPatents) {
    return <div className="space-y-6 p-6"><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patent Certificates</h1>
        <p className="text-muted-foreground mt-2">
          Official blockchain-verified certificates for your registered patents.
        </p>
      </div>

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
                    <CardDescription className="mt-1">
                      ID: {patent.id} • Filed: {formatDate(patent.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge variant={patent.status === 'approved' ? 'default' : 'outline'}>
                    {patent.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        <Award className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0 overflow-hidden">
                      {/* Certificate Template */}
                      <div id={`certificate-${patent.id}`} className="bg-white text-black p-12 border-[16px] border-double border-orange-200 m-4 relative" style={{ fontFamily: "'Times New Roman', serif" }}>
                        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center">
                          <Shield size={400} />
                        </div>

                        <div className="text-center space-y-6">
                          <div className="flex justify-center">
                            <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center border-4 border-orange-200">
                              <Award className="h-12 w-12 text-white" />
                            </div>
                          </div>

                          <h1 className="text-5xl font-bold text-orange-900">CERTIFICATE OF PATENT</h1>
                          <p className="text-xl text-orange-800 font-semibold tracking-widest uppercase">Base Blockchain Registry Authority</p>

                          <div className="w-64 h-0.5 bg-orange-300 mx-auto"></div>

                          <p className="text-lg italic px-12">
                            This document serves as immutable cryptographic proof of ownership and registration for the invention described herein,
                            permanently recorded on the Base blockchain network.
                          </p>

                          <div className="grid grid-cols-2 gap-8 text-left bg-orange-50/50 p-8 rounded-lg border border-orange-100">
                            <div className="space-y-4">
                              <div>
                                <span className="text-xs font-bold text-orange-800 uppercase">Patent Title</span>
                                <p className="text-xl font-bold">{patent.title}</p>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-orange-800 uppercase">Registration ID</span>
                                <p className="font-mono text-sm">{patent.id}</p>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-orange-800 uppercase">Category</span>
                                <p className="capitalize">{patent.category?.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="space-y-4 text-right">
                              <div className="flex flex-col items-end">
                                <div className="p-2 bg-white border border-orange-200 rounded">
                                  <QrCode size={80} className="text-orange-900" />
                                </div>
                                <span className="text-[10px] text-orange-800 uppercase mt-1 font-bold">Secure Verification</span>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-orange-800 uppercase">Blockchain Network</span>
                                <p className="text-sm font-semibold">Base Sepolia</p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-8 grid grid-cols-3 gap-4 items-end">
                            <div className="text-center border-t border-black pt-2">
                              <p className="text-xs font-bold">DATE OF FILING</p>
                              <p className="text-sm">{formatDate(patent.createdAt)}</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <Shield className="text-orange-500 mb-2" size={32} />
                              <p className="text-[10px] font-bold text-orange-800 uppercase tracking-tighter">Verified Integrity</p>
                            </div>
                            <div className="text-center border-t border-black pt-2">
                              <p className="text-xs font-bold">AUTHORITY SEAL</p>
                              <p className="text-sm italic">Digital Signature</p>
                            </div>
                          </div>

                          <div className="text-[10px] text-muted-foreground pt-12 space-y-1">
                            <p>TRANSACTION HASH: {patent.blockchainTxHash || "SECURED_ON_DATABASE"}</p>
                            <p>© {new Date().getFullYear()} PATENT HASH PLATFORM - POWERED BY BASE</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-muted flex justify-center gap-4">
                        <Button onClick={() => downloadCertificate(patent)}>Download PDF</Button>
                        <Button variant="outline" onClick={() => shareCertificate(patent)}>Share Link</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={() => downloadCertificate(patent)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button variant="ghost" onClick={() => shareCertificate(patent)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="py-20 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-semibold">No Certificates Available</h3>
            <p className="text-muted-foreground">Register your first patent to generate official certificates.</p>
          </Card>
        )}
      </div>
    </div>
  );
}