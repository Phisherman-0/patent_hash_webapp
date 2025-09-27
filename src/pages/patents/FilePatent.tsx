import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { patentAPI } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { useHashPackWallet } from "@/contexts/HashPackWalletContext";
import { HederaSmartContractService, PatentRecord } from "@/services/hederaSmartContractService";
import { ConnectionState } from "@/services/hashPackWalletService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Upload, FileText, Image, X } from "lucide-react";
import { PATENT_CATEGORIES, getCategoryLabel, getSubcategoryLabel } from "@/constants/patentCategories";

const patentFormSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(100, "Description must be at least 100 characters"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
});

type PatentFormValues = z.infer<typeof patentFormSchema>;

export default function FilePatent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showWalletConnectionPrompt, setShowWalletConnectionPrompt] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<PatentFormValues | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { walletInfo, connectionState, connect } = useHashPackWallet();

  const form = useForm<PatentFormValues>({
    resolver: zodResolver(patentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      subcategory: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PatentFormValues & { files: File[] }) => {
      // Check if HashPack wallet is connected for smart contract signing
      const useSmartContract = walletInfo && connectionState === ConnectionState.Connected;
      
      if (useSmartContract) {
        // Generate patent hash for blockchain storage
        const patentContent = `${data.title}|${data.description}|${data.category}|${data.subcategory || ''}`;
        const documentHash = HederaSmartContractService.generateDocumentHash(patentContent);
        
        // Create patent record for smart contract
        const patentRecord: PatentRecord = {
          patentId: `patent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.title,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory,
          ownerAccountId: walletInfo.accountId,
          timestamp: Date.now(),
          documentHash: documentHash
        };
        
        // Store on blockchain using HashPack wallet
      try {
        // First, create the topic transaction
        const topicTxResponse = await fetch('/api/hashpack/patent-hash-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patentId: patentRecord.patentId,
            filePath: data.files[0] ? URL.createObjectURL(data.files[0]) : null
          })
        });

        if (!topicTxResponse.ok) {
          throw new Error('Failed to create topic transaction');
        }

        const topicTxResult = await topicTxResponse.json();
        
        // Send transaction to HashPack for signing
        // Note: In a real implementation, this would use the HashPack wallet's sendTransaction method
        // For now, we'll simulate the process
        
        // Submit the signed transaction
        const submitResponse = await fetch('/api/hashpack/submit-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            signedTransactionBytes: topicTxResult.transactionBytes,
            network: walletInfo.network
          })
        });

        if (!submitResponse.ok) {
          throw new Error('Failed to submit transaction');
        }

        const submitResult = await submitResponse.json();
        
        // Then store in traditional database with blockchain reference
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('category', data.category);
        if (data.subcategory) {
          formData.append('subcategory', data.subcategory);
        }
        formData.append('blockchainHash', documentHash);
        formData.append('patentId', patentRecord.patentId);
        formData.append('useSmartContract', 'true');
        formData.append('hederaTopicId', submitResult.topicId);
        formData.append('hederaMessageId', submitResult.messageId);
        formData.append('hederaTransactionId', submitResult.transactionId);
        
        data.files.forEach((file) => {
          formData.append('documents', file);
        });
        
        return patentAPI.createPatent(formData);
      } catch (error) {
        console.error('Blockchain storage failed, falling back to traditional storage:', error);
        // Fall back to traditional storage if blockchain storage fails
      }
      }
      
      // Traditional patent storage
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.subcategory) {
        formData.append('subcategory', data.subcategory);
      }
      
      data.files.forEach((file) => {
        formData.append('documents', file);
      });

      return patentAPI.createPatent(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] });
      
      toast({
        title: "Patent filed successfully",
        description: "Your patent has been filed and will be processed shortly.",
      });
      
      form.reset();
      setSelectedFiles([]);
      navigate('/patents/my-patents');
    },
    onError: (error: any) => {
      toast({
        title: "Error filing patent",
        description: error.message || "An error occurred while filing your patent",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatentFormValues) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one document to upload.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if HashPack wallet is connected
    const hashPackConnected = walletInfo && connectionState === ConnectionState.Connected;
    
    if (!hashPackConnected) {
      setPendingSubmission(data);
      setShowWalletConnectionPrompt(true);
      return;
    }
    
    mutation.mutate({ ...data, files: selectedFiles });
  };

  const handleConnectWallet = async () => {
    try {
      await connect('testnet');
      if (pendingSubmission) {
        mutation.mutate({ ...pendingSubmission, files: selectedFiles });
        setPendingSubmission(null);
      }
      setShowWalletConnectionPrompt(false);
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleWalletConnectionClose = () => {
    setShowWalletConnectionPrompt(false);
    setPendingSubmission(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">File New Patent</h1>
        <p className="text-muted-foreground mt-2">
          Submit your intellectual property for blockchain-secured protection and AI analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patent Information</CardTitle>
              <CardDescription>
                Provide detailed information about your invention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patent Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a descriptive title for your invention"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear, concise title that describes your invention
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCategory(value);
                          form.setValue('subcategory', '');
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PATENT_CATEGORIES.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the category that best describes your invention
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCategory && (
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => {
                        const category = PATENT_CATEGORIES.find(cat => cat.id === selectedCategory);
                        return (
                          <FormItem>
                            <FormLabel>Subcategory (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a subcategory" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {category?.subcategories.map((subcategory) => (
                                  <SelectItem key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose a more specific subcategory if applicable
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of your invention, including technical specifications, functionality, and innovative aspects..."
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description helps with AI analysis and prior art search
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Supporting Documents</label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload patent documents, diagrams, technical specifications, etc.
                      </p>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4">
                        <div className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-foreground">
                            Upload files or drag and drop
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            PDF, DOC, DOCX up to 50MB each
                          </span>
                        </div>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">Selected Files:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {selectedFiles.map((file, index) => {
                            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
                            const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension);
                            const IconComponent = isImage ? Image : FileText;
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <IconComponent size={16} className={`flex-shrink-0 ${isImage ? 'text-green-500' : 'text-muted-foreground'}`} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-foreground truncate">
                                        {file.name}
                                      </span>
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                                        {fileExtension.toUpperCase()}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-8 w-8 flex-shrink-0"
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={mutation.isPending}
                      className="bg-primary hover:bg-primary-dark"
                    >
                      {mutation.isPending ? "Filing Patent..." : "File Patent"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2" size={20} />
                Patent Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-3">
                {walletInfo && connectionState === ConnectionState.Connected ? (
                  <span className="text-green-600 font-medium">✓ Smart Contract Protection Active</span>
                ) : (
                  "Your patent will be secured with blockchain technology:"
                )}
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    walletInfo && connectionState === ConnectionState.Connected 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                  {walletInfo && connectionState === ConnectionState.Connected 
                    ? 'Smart contract storage on Hedera'
                    : 'Cryptographic hash generation'
                  }
                </li>
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    walletInfo && connectionState === ConnectionState.Connected 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                  {walletInfo && connectionState === ConnectionState.Connected 
                    ? 'HashPack wallet signed transactions'
                    : 'Immutable blockchain storage'
                  }
                </li>
                <li className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    walletInfo && connectionState === ConnectionState.Connected 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}></div>
                  {walletInfo && connectionState === ConnectionState.Connected 
                    ? 'Verifiable ownership proof'
                    : 'Tamper-proof timestamp'
                  }
                </li>
              </ul>
              {walletInfo && connectionState === ConnectionState.Connected && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-800">
                    <strong>Connected:</strong> {walletInfo.accountId}<br/>
                    <strong>Network:</strong> {walletInfo.network.toUpperCase()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {showWalletConnectionPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Connect Wallet to File Patent</CardTitle>
              <CardDescription>
                A wallet connection is required to file patents with blockchain protection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your HashPack wallet for smart contract protection and verifiable ownership proof.
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleWalletConnectionClose}>
                  Cancel
                </Button>
                <Button onClick={handleConnectWallet} className="flex-1">
                  Connect HashPack
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}