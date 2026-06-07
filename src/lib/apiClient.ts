import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // Use relative URL to leverage Vite proxy in development
  // and same-origin paths in production.
  return ''; 
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

// Request interceptor - no longer needed for tokens as we use HttpOnly cookies
// But we keep it empty for future needs (intercepting errors etc.)
apiClient.interceptors.request.use(
  (config) => config,
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
        // Handle unauthorized silently in the interceptor
        // Let the application (Redux thunks) handle the redirect
        console.log('UNAUTHORIZED REQUEST - 401');
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
