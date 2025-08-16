import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // Check if we're in production build
  const isProduction = import.meta.env.PROD;
  
  // Use environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production: use same origin (backend serves frontend)
  if (isProduction) {
    return window.location.origin;
  }
  
  // Development: use localhost backend
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance with base URL and credentials
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const responseData = error.response.data as { message?: string };
      const message = responseData?.message || error.message;
      
      if (status === 401) {
        // Handle unauthorized - only redirect if not already on login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject({
        status,
        message,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        status: 0,
        message: 'No response from server. Please check your connection.',
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        status: 0,
        message: error.message,
      });
    }
  }
);

// API methods
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.post<T>(url, data, config).then(response => response.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.put<T>(url, data, config).then(response => response.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    apiClient.delete<T>(url, config).then(response => response.data),
    
  // Special method for file uploads
  upload: <T>(url: string, formData: FormData, onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void): Promise<T> => {
    return apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          onUploadProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total
          });
        }
      } : undefined,
    }).then(response => response.data);
  },
};

export default api;
