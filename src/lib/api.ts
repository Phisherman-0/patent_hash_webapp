// API configuration for frontend
const getApiBaseUrl = () => {
  // Use environment variable if available
  if ((import.meta as any).env.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  
  // Check if we're in production build
  const isProduction = (import.meta as any).env.PROD;
  
  // Production: use production API URL
  if (isProduction) {
    return 'https://patent-hash-api.onrender.com';
  }
  
  // Development: use localhost backend
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Default fetch options with credentials for sessions
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export { API_BASE_URL };