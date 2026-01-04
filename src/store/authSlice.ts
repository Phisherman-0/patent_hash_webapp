import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/lib/apiService';
import { authTimeoutService } from '@/services/authTimeoutService';

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    emailUpdates: boolean;
    patentAlerts: boolean;
    systemUpdates: boolean;
  };
  privacy?: {
    profileVisibility: 'public' | 'private';
    shareAnalytics: boolean;
  };
  preferences?: {
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security?: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
  [key: string]: any; // Allow other settings
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  settings?: UserSettings;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Load user from localStorage on app start
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // First check localStorage
      const storedUser = localStorage.getItem('patent_hash_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Return cached user immediately, verify in background
        // This prevents unnecessary API calls on every page load
        setTimeout(async () => {
          try {
            await authAPI.getCurrentUser();
          } catch (error) {
            // Session expired, clear localStorage and redirect
            localStorage.removeItem('patent_hash_user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }, 1000);
        
        return parsedUser;
      }
      
      // No stored user, don't make unnecessary server calls
      // Let login handle authentication
      
      return null;
    } catch (error) {
      return rejectWithValue('Failed to initialize authentication');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await authAPI.login(credentials);
      localStorage.setItem('patent_hash_user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error?.response?.data?.message || error?.message || 'Login failed';
      const isUnverified = error?.response?.data?.isUnverified;

      if (isUnverified) {
        return rejectWithValue({ message, isUnverified: true });
      }

      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string;
  }, { rejectWithValue }) => {
    try {
      const user = await authAPI.register(userData);
      localStorage.setItem('patent_hash_user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      console.error('Register error:', error);
      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authAPI.getCurrentUser();
      localStorage.setItem('patent_hash_user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue('Failed to fetch user data');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authAPI.logout();
      
      localStorage.removeItem('patent_hash_user');
      
      // Redirect to login page - only if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return null;
    } catch (error) {
      // Even if server request fails, clear local data
      localStorage.removeItem('patent_hash_user');
      
      // Still redirect to login page on error - only if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isInitialized = true;
      localStorage.removeItem('patent_hash_user');
      // Stop session timeout monitoring
      authTimeoutService.stop();
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.user = null;
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isLoading = false;
        state.error = null;
        // Start session timeout monitoring
        authTimeoutService.start();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        state.error = typeof payload === 'string' ? payload : (payload?.message || 'Login failed');
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isLoading = false;
        state.error = null;
        // Start session timeout monitoring
        authTimeoutService.start();
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload as User;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isLoading = false;
        state.error = null;
        // Stop session timeout monitoring
        authTimeoutService.stop();
      });
  },
});

export const { clearError, clearUser } = authSlice.actions;
export default authSlice.reducer;
