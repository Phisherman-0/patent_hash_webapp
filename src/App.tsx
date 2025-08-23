import { useEffect } from "react";
import { Router, Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { initializeAuth } from "@/store/authSlice";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";

// Import pages
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import AuthPage from "@/pages/auth/AuthPage";

// Patents
import FilePatent from "@/pages/patents/FilePatent";
import MyPatents from "@/pages/patents/MyPatents";
import StatusTracking from "@/pages/patents/StatusTracking";
import PatentValuation from "@/pages/patents/PatentValuation";
import DocumentManagement from "@/pages/patents/DocumentManagement";
import DraftingAssistant from "@/pages/patents/DraftingAssistant";
import QuickVerification from "@/pages/patents/QuickVerification";

// AI Features
import PriorArtSearch from "@/pages/ai/PriorArtSearch";
import SimilarityDetection from "@/pages/ai/SimilarityDetection";
import Classification from "@/pages/ai/Classification";
import PatentAnalytics from "@/pages/ai/PatentAnalytics";

// Verification
import BlockchainVerification from "@/pages/verification/BlockchainVerification";
import OwnershipVerification from "@/pages/verification/OwnershipVerification";
import PatentCertificates from "@/pages/verification/PatentCertificates";

// Settings
import WalletSettings from "@/pages/settings/WalletSettings";

import NotFound from "@/pages/not-found";

function App() {
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <WalletProvider>
        <div className="App">
          <Router>
          <Switch>
          {/* Login route */}
          <Route path="/login" component={AuthPage} />
          
          {/* Redirect root to login if not authenticated */}
          {!user ? (
            <Route path="/">
              <Redirect to="/login" />
            </Route>
          ) : (
            <>
              {/* Protected routes wrapped in Layout */}
              <ProtectedRoute>
                <Layout>
                  <Route path="/" component={Dashboard} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/wallet">
                    <WalletSettings />
                  </Route>
                  <Route path="/analytics" component={Analytics} />
                  
                  {/* Patents Routes */}
                  <Route path="/patents/file" component={FilePatent} />
                  <Route path="/patents/my-patents" component={MyPatents} />
                  <Route path="/patents/status" component={StatusTracking} />
                  <Route path="/patents/valuation" component={PatentValuation} />
                  <Route path="/patents/documents" component={DocumentManagement} />
                  <Route path="/patents/drafting" component={DraftingAssistant} />
                  <Route path="/patents/quick-verify" component={QuickVerification} />
                  
                  {/* AI Features Routes */}
                  <Route path="/ai/prior-art-search" component={PriorArtSearch} />
                  <Route path="/ai/similarity" component={SimilarityDetection} />
                  <Route path="/ai/classification" component={Classification} />
                  <Route path="/ai/analytics" component={PatentAnalytics} />
                  
                  {/* Verification Routes */}
                  <Route path="/verification/blockchain" component={BlockchainVerification} />
                  <Route path="/verification/ownership" component={OwnershipVerification} />
                  <Route path="/verification/certificates" component={PatentCertificates} />
                </Layout>
              </ProtectedRoute>
            </>
          )}
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
        </Router>
        <Toaster />
        </div>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
