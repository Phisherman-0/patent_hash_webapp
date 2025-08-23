import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { patentAPI, documentAPI, blockchainAPI, type PatentDocument } from "@/lib/apiService";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { clearUser } from "@/store/authSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Shield,
  Brain,
  Plus,
  Trash2,
  Coins,
} from "lucide-react";
import { Link } from "wouter";

interface Patent {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  patentNumber?: string;
  estimatedValue?: string;
  filedAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  hederaTopicId?: string;
  hederaNftId?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-muted text-muted-foreground",
};

const categoryIcons: Record<string, React.ComponentType<any>> = {
  medical_technology: FileText,
  software_ai: Brain,
  renewable_energy: Shield,
  manufacturing: FileText,
  biotechnology: FileText,
  automotive: FileText,
  telecommunications: FileText,
  other: FileText,
};

export default function MyPatents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [showPatentModal, setShowPatentModal] = useState(false);
  const [deletePatentId, setDeletePatentId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);
  const [, navigate] = useLocation();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to view this page.",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, isInitialized, isLoading, toast, navigate]);

  const { data: patents, isLoading: patentsLoading, error } = useQuery({
    queryKey: ["patents"],
    queryFn: patentAPI.getPatents,
    retry: false,
  });

  // Query for patent documents when a patent is selected
  const { data: patentDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ["patent-documents", selectedPatent?.id],
    queryFn: () => selectedPatent ? documentAPI.getPatentDocuments(selectedPatent.id) : Promise.resolve([]),
    enabled: !!selectedPatent,
    retry: false,
  });

  const handleViewPatent = (patent: Patent) => {
    setSelectedPatent(patent);
    setShowPatentModal(true);
  };

  const handleDeleteClick = (patentId: string) => {
    setDeletePatentId(patentId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletePatentId) {
      deleteMutation.mutate(deletePatentId);
      setShowDeleteDialog(false);
      setDeletePatentId(null);
    }
  };

  const handleDownloadDocument = async (doc: PatentDocument) => {
    try {
      const response = await documentAPI.downloadDocument(doc.id);
      const blob = new Blob([response as any], { type: doc.fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `Downloading ${doc.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const deleteMutation = useMutation({
    mutationFn: async (patentId: string) => {
      return patentAPI.deletePatent(patentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Patent deleted",
        description: "The patent has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        dispatch(clearUser());
        navigate('/login');
        return;
      }
      toast({
        title: "Error deleting patent",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mintNFTMutation = useMutation({
    mutationFn: async (patentId: string) => {
      return blockchainAPI.mintNFT(patentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patents"] });
      toast({
        title: "NFT Minted Successfully",
        description: "Your patent NFT has been minted on the Hedera blockchain.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "NFT Minting Failed",
        description: error.message || "Failed to mint NFT. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCategoryName = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStatusName = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (value?: string) => {
    if (!value) return "Not valued";
    return `$${Number(value).toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const filteredPatents = patents?.filter((patent: Patent) => {
    const matchesSearch = patent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || patent.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || patent.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  if (patentsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">Error loading patents</h3>
        <p className="mt-1 text-sm text-muted-foreground">There was an error loading your patents. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Patents</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your intellectual property portfolio
          </p>
        </div>
        <Link href="/patents/file">
          <Button className="mt-4 sm:mt-0 bg-primary hover:bg-primary-dark">
            <Plus className="mr-2" size={16} />
            File New Patent
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search patents by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="medical_technology">Medical Technology</SelectItem>
                <SelectItem value="software_ai">Software & AI</SelectItem>
                <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="biotechnology">Biotechnology</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="telecommunications">Telecommunications</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patents Table */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle>Patents ({filteredPatents.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2" size={16} />
                More Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPatents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No patents found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {patents && patents.length === 0 
                  ? "Get started by filing your first patent."
                  : "Try adjusting your search criteria."
                }
              </p>
              {patents && patents.length === 0 && (
                <div className="mt-6">
                  <Link href="/patents/file">
                    <Button>
                      <Plus className="mr-2" size={16} />
                      File New Patent
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead>Blockchain</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatents.map((patent: Patent) => {
                    const CategoryIcon = categoryIcons[patent.category] || FileText;
                    
                    return (
                      <TableRow key={patent.id} className="hover:bg-accent">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CategoryIcon className="text-primary" size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">
                                {patent.title}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {patent.patentNumber || `ID: ${patent.id.slice(0, 8)}...`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[patent.status] || statusColors.draft}>
                            {formatStatusName(patent.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {formatCategoryName(patent.category)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {formatCurrency(patent.estimatedValue)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(patent.filedAt || patent.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center space-x-1">
                            {patent.hederaTopicId && (
                              <Shield className="text-green-600" size={16} />
                            )}
                            {patent.hederaNftId && (
                              <Badge variant="secondary" className="text-xs">NFT</Badge>
                            )}
                            {!patent.hederaTopicId && (
                              <span className="text-muted-foreground text-xs">Not secured</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewPatent(patent)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(patent.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patent Details Modal */}
      <Dialog open={showPatentModal} onOpenChange={setShowPatentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {selectedPatent && (
                  React.createElement(categoryIcons[selectedPatent.category] || FileText, {
                    className: "text-primary",
                    size: 20
                  })
                )}
              </div>
              {selectedPatent?.title}
            </DialogTitle>
            <DialogDescription>
              Patent ID: {selectedPatent?.patentNumber || selectedPatent?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Status</h4>
                    <Badge className={statusColors[selectedPatent.status] || statusColors.draft}>
                      {formatStatusName(selectedPatent.status)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Category</h4>
                    <p className="text-sm">{formatCategoryName(selectedPatent.category)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Estimated Value</h4>
                    <p className="text-sm font-medium">{formatCurrency(selectedPatent.estimatedValue)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Filed Date</h4>
                    <p className="text-sm">{formatDate(selectedPatent.filedAt || selectedPatent.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Blockchain Status</h4>
                    <div className="flex items-center gap-2">
                      {selectedPatent.hederaTopicId ? (
                        <>
                          <Shield className="text-green-600" size={16} />
                          <span className="text-sm text-green-600">Secured</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not secured</span>
                      )}
                      {selectedPatent.hederaNftId && (
                        <Badge variant="secondary" className="text-xs ml-2">NFT Minted</Badge>
                      )}
                    </div>
                  </div>
                  {selectedPatent.hederaTopicId && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Hedera Topic ID</h4>
                      <p className="text-xs font-mono bg-muted p-2 rounded">{selectedPatent.hederaTopicId}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Description</h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedPatent.description}</p>
                </div>
              </div>
              
              {/* Documents Section */}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Documents</h4>
                <div className="border rounded-lg p-4">
                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
                    </div>
                  ) : patentDocuments && patentDocuments.length > 0 ? (
                    <div className="space-y-3">
                      {patentDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p className="text-sm">No documents available for this patent</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatentModal(false)}>
              Close
            </Button>
            {selectedPatent && !selectedPatent.hederaNftId && (
              <Button 
                onClick={() => mintNFTMutation.mutate(selectedPatent.id)}
                disabled={mintNFTMutation.isPending}
                className="mr-2"
              >
                <Coins className="mr-2" size={16} />
                {mintNFTMutation.isPending ? "Minting NFT..." : "Mint NFT"}
              </Button>
            )}
            <Button>
              <Download className="mr-2" size={16} />
              Download Patent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this patent?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the patent
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Patent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
