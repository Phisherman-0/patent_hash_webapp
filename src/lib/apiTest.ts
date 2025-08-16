import { apiService } from './apiService';

// Simple API connectivity test
export const testAPIConnectivity = async () => {
  try {
    console.log('Testing API connectivity...');
    
    // Test health endpoint (if available)
    const response = await fetch('http://localhost:5000/api/health', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend API is running:', data);
      return { success: true, message: 'API connection successful', data };
    } else {
      console.log('❌ Backend API returned error:', response.status);
      return { success: false, message: `API returned ${response.status}` };
    }
  } catch (error) {
    console.log('❌ Failed to connect to backend API:', error);
    return { success: false, message: 'Connection failed', error };
  }
};

// Test authentication endpoints
export const testAuthEndpoints = async () => {
  try {
    console.log('Testing auth endpoints...');
    
    // Test get current user (should return 401 if not authenticated)
    const userResponse = await fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include'
    });
    
    console.log('Auth user endpoint status:', userResponse.status);
    return { success: true, status: userResponse.status };
  } catch (error) {
    console.log('❌ Auth endpoint test failed:', error);
    return { success: false, error };
  }
};

// Run all tests
export const runAPITests = async () => {
  console.log('🧪 Running API connectivity tests...');
  
  const healthTest = await testAPIConnectivity();
  const authTest = await testAuthEndpoints();
  
  return {
    health: healthTest,
    auth: authTest,
    timestamp: new Date().toISOString()
  };
};
