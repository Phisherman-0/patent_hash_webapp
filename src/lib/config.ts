// API Configuration
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    USER: `${API_BASE_URL}/api/auth/user`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/api/dashboard/stats`,
    ACTIVITIES: `${API_BASE_URL}/api/dashboard/activities`,
    CATEGORY_STATS: `${API_BASE_URL}/api/dashboard/category-stats`,
  },
  PATENTS: {
    LIST: `${API_BASE_URL}/api/patents`,
    CREATE: `${API_BASE_URL}/api/patents`,
    GET: (id: string) => `${API_BASE_URL}/api/patents/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/patents/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/patents/${id}`,
    AI_ANALYSIS: (id: string) => `${API_BASE_URL}/api/patents/${id}/ai-analysis`,
  },
  AI: {
    PRIOR_ART_SEARCH: `${API_BASE_URL}/api/ai/prior-art-search`,
    PATENT_VALUATION: `${API_BASE_URL}/api/ai/patent-valuation`,
    SIMILARITY_DETECTION: `${API_BASE_URL}/api/ai/similarity-detection`,
    PATENT_DRAFTING: `${API_BASE_URL}/api/ai/patent-drafting`,
    CLASSIFY_INNOVATION: `${API_BASE_URL}/api/ai/classify-innovation`,
  },
  BLOCKCHAIN: {
    VERIFY: (patentId: string) => `${API_BASE_URL}/api/blockchain/verify/${patentId}`,
    MINT_NFT: (patentId: string) => `${API_BASE_URL}/api/blockchain/mint-nft/${patentId}`,
  },
  SEARCH: {
    PATENTS: `${API_BASE_URL}/api/search/patents`,
  },
} as const;
