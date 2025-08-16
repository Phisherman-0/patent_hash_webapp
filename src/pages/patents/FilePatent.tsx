import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { patentAPI } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Brain, Shield } from "lucide-react";

const patentFormSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(100, "Description must be at least 100 characters"),
  category: z.enum([
    "medical_technology",
    "software_ai", 
    "renewable_energy",
    "manufacturing",
    "biotechnology",
    "automotive",
    "telecommunications",
    "other"
  ]),
});

type PatentFormValues = z.infer<typeof patentFormSchema>;

const categoryOptions = [
  { value: "medical_technology", label: "Medical Technology" },
  { value: "software_ai", label: "Software & AI" },
  { value: "renewable_energy", label: "Renewable Energy" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "biotechnology", label: "Biotechnology" },
  { value: "automotive", label: "Automotive" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "other", label: "Other" },
];

export default function FilePatent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const form = useForm<PatentFormValues>({
    resolver: zodResolver(patentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "medical_technology",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PatentFormValues & { files: File[] }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      
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
    onError: (error) => {
      toast({
        title: "Error filing patent",
        description: error.message,
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
    
    mutation.mutate({ ...data, files: selectedFiles });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">File New Patent</h1>
        <p className="text-gray-600 mt-2">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                      <label className="text-sm font-medium text-gray-700">Supporting Documents</label>
                      <p className="text-sm text-gray-500 mb-2">
                        Upload patent documents, diagrams, technical specifications, etc.
                      </p>
                    </div>
                    
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <div className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Upload files or drag and drop
                          </span>
                          <span className="block text-sm text-gray-500">
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
                        <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
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
                <Brain className="mr-2" size={20} />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Your patent will be automatically analyzed for:
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Prior art detection
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Similarity scoring
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Market valuation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  Classification
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2" size={20} />
                Blockchain Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Your patent will be secured with:
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  SHA-256 hash generation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Hedera consensus storage
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Immutable timestamp
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  NFT representation
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
