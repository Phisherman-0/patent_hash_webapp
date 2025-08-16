import { api } from './apiClient';

// Types for API responses
export interface Patent {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  aiSuggestedCategory?: string;
  aiConfidence?: string;
  estimatedValue?: string;
  hederaTopicId?: string;
  hederaMessageId?: string;
  hederaNftId?: string;
  hashValue?: string;
}

export interface DashboardStats {
  totalPatents: number;
  pendingReviews: number;
  blockchainVerified: number;
  portfolioValue: string;
}

export interface Activity {
  id: string;
  patentId: string;
  userId: string;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface AIAnalysis {
  id: string;
  patentId: string;
  analysisType: string;
  result: any;
  confidence: string;
  createdAt: string;
}

export interface PatentDocument {
  id: string;
  patentId: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  hashValue: string;
  createdAt: string;
}

// Auth API calls
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/user'),
  
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    api.put('/auth/user', data),
  
  updateSettings: (settings: any) =>
    api.put('/auth/user/settings', { settings }),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: (): Promise<DashboardStats> => 
    api.get('/dashboard/stats'),
  
  getActivities: (limit?: number): Promise<Activity[]> => 
    api.get(`/dashboard/activities${limit ? `?limit=${limit}` : ''}`),
  
  getCategoryStats: (): Promise<CategoryStat[]> => 
    api.get('/dashboard/category-stats'),
};

// Patent API calls
export const patentAPI = {
  getPatents: (): Promise<Patent[]> => 
    api.get('/patents'),
  
  getPatent: (id: string): Promise<Patent> => 
    api.get(`/patents/${id}`),
  
  createPatent: (formData: FormData): Promise<Patent> => 
    api.upload('/patents', formData),
  
  updatePatent: (id: string, data: Partial<Patent>): Promise<Patent> => 
    api.put(`/patents/${id}`, data),
  
  deletePatent: (id: string): Promise<void> => 
    api.delete(`/patents/${id}`),
  
  getAIAnalysis: (id: string): Promise<AIAnalysis[]> => 
    api.get(`/patents/${id}/ai-analysis`),
};

// AI API calls
export const aiAPI = {
  priorArtSearch: (data: { patentId: string; description: string }) =>
    api.post('/ai/prior-art-search', data),
  
  patentValuation: (data: { patentId: string }) =>
    api.post('/ai/patent-valuation', data),
  
  similarityDetection: (data: { patentId: string; targetText: string }) =>
    api.post('/ai/similarity-detection', data),
  
  patentDrafting: (data: { title: string; description: string; category: string }) =>
    api.post('/ai/patent-drafting', data),
  
  classifyInnovation: (data: { description: string }) =>
    api.post('/ai/classify-innovation', data),
};

// Blockchain API calls
export const blockchainAPI = {
  verifyPatent: (patentId: string) =>
    api.get(`/blockchain/verify/${patentId}`),
  
  mintNFT: (patentId: string) =>
    api.post(`/blockchain/mint-nft/${patentId}`),
};

// Document API calls
export const documentAPI = {
  getUserDocuments: (): Promise<PatentDocument[]> =>
    api.get('/documents/user'),
  
  getPatentDocuments: async (patentId: string): Promise<PatentDocument[]> => {
    const docs = await api.get<PatentDocument[]>('/documents/user');
    return docs.filter(doc => doc.patentId === patentId);
  },
  
  downloadDocument: (documentId: string) =>
    api.get(`/documents/${documentId}/download`, { responseType: 'blob' }),
  
  deleteDocument: (documentId: string): Promise<void> =>
    api.delete(`/documents/${documentId}`),
};

// Search API calls
export const searchAPI = {
  searchPatents: (query: string): Promise<Patent[]> =>
    api.get(`/search/patents?q=${encodeURIComponent(query)}`),
};

// Combined API service
export const apiService = {
  auth: authAPI,
  dashboard: dashboardAPI,
  patents: patentAPI,
  documents: documentAPI,
  ai: aiAPI,
  blockchain: blockchainAPI,
  search: searchAPI,
};

export default apiService;
