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

export interface Consultant {
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  availability?: {
    status: 'available' | 'busy' | 'offline';
    message?: string;
  };
  rating?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Consultant {
  id: string;
  userId: string;
  specialization?: string;
  bio?: string;
  experienceYears?: number;
  hourlyRate?: number;
  availability?: any;
  rating?: number;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  consultantId: string;
  title: string;
  description?: string;
  appointmentDate: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  userId: string;
  consultantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Auth API calls
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => 
    api.post('/auth/login', credentials),

  register: async (userData: { firstName: string; lastName: string; email: string; password: string; role?: string }) => 
    api.post('/auth/register', userData),

  logout: async () => 
    api.post('/auth/logout'),

  getCurrentUser: async () => 
    api.get('/auth/user'),

  updateProfile: async (profileData: { firstName: string; lastName: string; email: string }) => 
    api.put('/auth/profile', profileData),

  uploadProfileImage: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('profileImage', imageFile);
    return api.upload('/auth/profile/image', formData);
  },

  deleteProfileImage: async () => 
    api.delete('/auth/profile/image'),

  verifyOTP: async (data: { email: string; otp: string }) => 
    api.post('/auth/verify-otp', data),

  resendOTP: async (data: { email: string }) => 
    api.post('/auth/resend-otp', data),
};

// Wallet API calls - Updated for new database schema
export const walletAPI = {
  // HashPack wallet connection
  connectHashPack: async (connectionData: { 
    accountId: string; 
    network: 'testnet' | 'mainnet';
    sessionData?: any;
  }) =>
    api.post('/api/wallet/hashpack/connect', connectionData),

  // Legacy wallet validation (for backward compatibility)
  validate: async (walletConfig: { accountId: string; privateKey: string; network: string }) =>
    api.post('/api/wallet/validate', walletConfig),

  // Get wallet connections for current user
  getConnections: async () =>
    api.get('/api/wallet/connections'),

  // Get specific wallet connection status
  getStatus: async (connectionId?: string) =>
    api.get(`/wallet/status${connectionId ? `/${connectionId}` : ''}`),

  // Disconnect wallet
  disconnect: async (connectionId: string) =>
    api.delete(`/api/wallet/disconnect/${connectionId}`),

  // Store patent hash using wallet connection
  storePatentHash: async (data: {
    patentId: string;
    connectionId: string;
    hashValue: string;
  }) =>
    api.post('/api/wallet/store-hash', data),
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
  
  verifyOwnership: (data: { verificationMethod: string; identifier: string }) =>
    api.post('/blockchain/verify-ownership', data),
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
  
  verifyOwnership: (data: { verificationMethod: string; identifier: string }) =>
    api.post('/blockchain/verify-ownership', data),
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

// Consultant API calls
export const consultantAPI = {
  getConsultants: (): Promise<Consultant[]> =>
    api.get('/consultants'),
  
  getConsultant: (id: string): Promise<Consultant> =>
    api.get(`/consultants/${id}`),
  
  getConsultantsBySpecialization: (specialization: string): Promise<Consultant[]> =>
    api.get(`/consultants/specialization/${specialization}`),
  
  getConsultantProfile: (): Promise<Consultant> =>
    api.get('/consultants/profile'),
  
  updateConsultantProfile: (data: Partial<Consultant>): Promise<Consultant> =>
    api.post('/consultants/profile', data),
    
  // Admin consultant management
  getUnverifiedConsultants: (): Promise<Consultant[]> =>
    api.get('/admin/consultants/unverified'),
    
  verifyConsultant: (id: string, notes?: string): Promise<Consultant> =>
    api.put(`/admin/consultants/${id}/verify`, { notes }),
    
  rejectConsultant: (id: string, notes: string): Promise<Consultant> =>
    api.put(`/admin/consultants/${id}/reject`, { notes }),
    
  getConsultantStatus: (id: string): Promise<{ 
    id: string; 
    isVerified: boolean; 
    verifiedBy?: string; 
    verifiedAt?: string; 
    verificationNotes?: string 
  }> =>
    api.get(`/admin/consultants/${id}/status`),
};

// Appointment API calls
export const appointmentAPI = {
  bookAppointment: (data: {
    consultantId: string;
    title: string;
    description?: string;
    appointmentDate: string;
    duration: number;
  }): Promise<Appointment> =>
    api.post('/appointments/book', data),
  
  getUserAppointments: (): Promise<Appointment[]> =>
    api.get('/appointments/user'),
  
  getConsultantAppointments: (): Promise<Appointment[]> =>
    api.get('/appointments/consultant'),
  
  updateAppointmentStatus: (id: string, status: 'confirmed' | 'cancelled'): Promise<Appointment> =>
    api.put(`/appointments/${id}/status`, { status }),
  
  cancelAppointment: (id: string): Promise<void> =>
    api.delete(`/appointments/${id}`),
};

// Chat API calls
export const chatAPI = {
  getChatRooms: (): Promise<ChatRoom[]> =>
    api.get('/chat/rooms'),
  
  getChatRoom: (id: string): Promise<ChatRoom> =>
    api.get(`/chat/rooms/${id}`),
  
  createChatRoom: (data: {
    userId: string;
    consultantId: string;
  }): Promise<ChatRoom> =>
    api.post('/chat/room', data),
  
  getChatMessages: (roomId: string): Promise<ChatMessage[]> =>
    api.get(`/chat/messages/${roomId}`),
  
  sendMessage: (data: {
    chatRoomId: string;
    message: string;
  }): Promise<ChatMessage> =>
    api.post('/chat/messages', data),
};

// Admin API calls
export const adminAPI = {
  getUsers: (): Promise<any[]> =>
    api.get('/admin/users'),
  
  updateUserRole: (id: string, role: string): Promise<any> =>
    api.put(`/admin/users/${id}/role`, { role }),
  
  deleteUser: (id: string): Promise<void> =>
    api.delete(`/admin/users/${id}`),
  
  getAppointments: (): Promise<Appointment[]> =>
    api.get('/admin/appointments'),
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
  wallet: walletAPI,
  consultants: consultantAPI,
  appointments: appointmentAPI,
  chat: chatAPI,
  admin: adminAPI,
};

export default apiService;
