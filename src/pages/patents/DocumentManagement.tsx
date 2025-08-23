import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  Hash,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentAPI, patentAPI, PatentDocument, Patent } from '@/lib/apiService';
import { useAppSelector } from '@/hooks/useAppDispatch';


export default function DocumentManagement() {
  const [documents, setDocuments] = useState<PatentDocument[]>([]);
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPatent, setSelectedPatent] = useState('all');
  const { toast } = useToast();
  const { user, isInitialized, isLoading: authLoading } = useAppSelector((state) => state.auth);

  // Fetch user documents
  const fetchDocuments = async () => {
    try {
      const data = await documentAPI.getUserDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    }
  };

  // Fetch user patents for filtering
  const fetchPatents = async () => {
    try {
      const data = await patentAPI.getUserPatents();
      setPatents(data);
    } catch (error) {
      console.error('Error fetching patents:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user || !isInitialized || authLoading) return;
      
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchPatents()]);
      setLoading(false);
    };
    
    loadData();
  }, [user, isInitialized, authLoading]);

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPatent = selectedPatent === 'all' || doc.patentId === selectedPatent;
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const patent = patents.find(p => p.id === doc.patentId);
      matchesCategory = patent?.category === selectedCategory;
    }
    
    return matchesSearch && matchesPatent && matchesCategory;
  });

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('word')) return '📄';
    return '📁';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Download document
  const downloadDocument = async (document: PatentDocument) => {
    try {
      const blob = await documentAPI.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Document downloaded successfully"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentAPI.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast({
        title: "Success",
        description: "Document deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  // Get patent title
  const getPatentTitle = (patentId: string) => {
    const patent = patents.find(p => p.id === patentId);
    return patent?.title || 'Unknown Patent';
  };

  // Get unique categories
  const categories = [...new Set(patents.map(p => p.category))];

  if (loading || !user || !isInitialized || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 md:px-4 pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Document Management</h1>
        <p className="text-muted-foreground">Manage and organize your patent documents</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>

            {/* Patent Filter */}
            <select
              value={selectedPatent}
              onChange={(e) => setSelectedPatent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Patents</option>
              {patents.map(patent => (
                <option key={patent.id} value={patent.id}>
                  {patent.title}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <div className="ml-2 md:ml-4">
                <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <Hash className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              <div className="ml-2 md:ml-4">
                <p className="text-xs font-medium text-muted-foreground">Verified Documents</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <User className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              <div className="ml-2 md:ml-4">
                <p className="text-xs font-medium text-muted-foreground">Patents</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">{patents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
              <div className="ml-2 md:ml-4">
                <p className="text-xs font-medium text-muted-foreground">This Month</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">
                  {documents.filter(doc => {
                    const docDate = new Date(doc.createdAt);
                    const now = new Date();
                    return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Your patent documents with blockchain verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="border border-border rounded-lg p-3 md:p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-2 md:space-x-4 min-w-0 flex-1">
                      <div className="text-xl md:text-2xl flex-shrink-0">
                        {getFileIcon(document.fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground text-sm md:text-base truncate">{document.fileName}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          Patent: {getPatentTitle(document.patentId)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.fileSize)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(document.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {document.fileType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(document)}
                        className="p-2"
                      >
                        <Download className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(document.id)}
                        className="p-2"
                      >
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Hash verification */}
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                    <span className="font-medium">Hash:</span> 
                    <span className="break-all ml-1">{document.hashValue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
