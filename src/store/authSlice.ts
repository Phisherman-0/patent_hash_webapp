import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '@/lib/apiService';

export interface UserSettings {
  notifications: {
    emailUpdates: boolean;
    patentAlerts: boolean;
    systemNotifications: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: string;
    dataSharing: boolean;
    analyticsOptIn: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    currency: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
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
        JSON.parse(storedUser);
        
        // Verify with server that session is still valid
        try {
          const serverUser = await authAPI.getCurrentUser();
          return serverUser;
        } catch (error) {
          // Session expired, clear localStorage
          localStorage.removeItem('patent_hash_user');
          return null; // Don't use cached user if server rejects
        }
      }
      
      // No stored user, check server session
      try {
        const user = await authAPI.getCurrentUser();
        localStorage.setItem('patent_hash_user', JSON.stringify(user));
        return user;
      } catch {
        // Network error or not authenticated
      }
      
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
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
      });
  },
});

export const { clearError, clearUser } = authSlice.actions;
export default authSlice.reducer;
