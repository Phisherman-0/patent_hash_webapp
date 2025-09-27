import { useEffect, useState } from "react";
import { Router, Route, Switch, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { initializeAuth, logoutUser } from "@/store/authSlice";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { HashPackWalletProvider } from "@/contexts/HashPackWalletContext";
import { HederaWalletProvider } from "@/contexts/HederaWalletContext";
import { WalletConnectContextProvider } from "@/contexts/WalletConnectContext";
import { WalletConnectClient } from "@/services/wallets/walletConnectClient";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

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

// Consultant pages
import ConsultantAppointments from "@/pages/consultant/Appointments";

// User consultant pages
import BrowseConsultants from "@/pages/consultants/Browse";
import UserAppointments from "@/pages/consultants/Appointments";

// Chat
import ChatPage from "@/pages/Chat";

// Admin
import AdminPanel from "@/pages/admin/Panel";

// Wallet Test
import WalletTest from "@/pages/WalletTest";

import NotFound from "@/pages/not-found";

function App() {
  const dispatch = useAppDispatch();
  const { user, isInitialized, isLoading } = useAppSelector(
    (state) => state.auth
  );
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Session timeout hook
  const { resetTimeout, getTimeRemaining } = useSessionTimeout({
    timeoutDuration: 30 * 60 * 1000, // 30 minutes
    warningDuration: 5 * 60 * 1000, // 5 minutes warning
    onWarning: () => {
      setTimeRemaining(getTimeRemaining());
      setShowTimeoutWarning(true);
    },
    onTimeout: () => {
      setShowTimeoutWarning(false);
    },
  });

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
      <WalletConnectContextProvider>
        <HashPackWalletProvider>
          <HederaWalletProvider>
            <WalletConnectClient />
            <div className="App">
              {/* Testnet Warning Message */}
              <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-primary text-white py-2 px-4 shadow-sm overflow-hidden hover:animate-scroll-paused">
                <div className="flex items-center whitespace-nowrap animate-scroll">
                  <span className="text-sm font-medium">
                    ⚠️ WARNING: This application is under development. Please use ONLY TESTNET wallets for testing purposes. Do not use mainnet wallets or real funds. ⚠️
                  </span>
                </div>
              </div>
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
                        <Route path="/wallet-test" component={WalletTest} />
                        <Route path="/analytics" component={Analytics} />

                        {/* Patents Routes */}
                        <Route path="/patents/file" component={FilePatent} />
                        <Route
                          path="/patents/my-patents"
                          component={MyPatents}
                        />
                        <Route
                          path="/patents/status"
                          component={StatusTracking}
                        />
                        <Route
                          path="/patents/valuation"
                          component={PatentValuation}
                        />
                        <Route
                          path="/patents/documents"
                          component={DocumentManagement}
                        />
                        <Route
                          path="/patents/drafting"
                          component={DraftingAssistant}
                        />

                        {/* AI Features Routes */}
                        <Route
                          path="/ai/prior-art-search"
                          component={PriorArtSearch}
                        />
                        <Route
                          path="/ai/similarity"
                          component={SimilarityDetection}
                        />
                        <Route
                          path="/ai/classification"
                          component={Classification}
                        />
                        <Route
                          path="/ai/analytics"
                          component={PatentAnalytics}
                        />

                        {/* Verification Routes */}
                        <Route
                          path="/verification/blockchain"
                          component={BlockchainVerification}
                        />
                        <Route
                          path="/verification/ownership"
                          component={OwnershipVerification}
                        />
                        <Route
                          path="/verification/certificates"
                          component={PatentCertificates}
                        />

                        {/* Consultant Routes */}
                        <Route
                          path="/consultant/appointments"
                          component={ConsultantAppointments}
                        />

                        {/* User Consultant Routes */}
                        <Route
                          path="/consultants/browse"
                          component={BrowseConsultants}
                        />
                        <Route
                          path="/consultants/appointments"
                          component={UserAppointments}
                        />

                        {/* Chat Routes */}
                        <Route
                          path="/consultants/messages"
                          component={ChatPage}
                        />
                        <Route
                          path="/consultant/messages"
                          component={ChatPage}
                        />

                        {/* Admin Routes */}
                        {user.role === 'admin' && (
                          <Route
                            path="/admin/users"
                            component={AdminPanel}
                          />
                        )}
                        {user.role === 'admin' && (
                          <Route
                            path="/admin/appointments"
                            component={AdminPanel}
                          />
                        )}
                      </Layout>
                    </ProtectedRoute>
                  </>
                )}

                {/* Fallback */}
                <Route component={NotFound} />
              </Switch>
            </Router>
            <SessionTimeoutWarning
              isOpen={showTimeoutWarning}
              timeRemaining={timeRemaining}
              onExtendSession={() => {
                setShowTimeoutWarning(false);
                resetTimeout();
              }}
              onLogout={() => {
                setShowTimeoutWarning(false);
                dispatch(logoutUser());
              }}
            />
            <Toaster />
            </div>
          </HederaWalletProvider>
        </HashPackWalletProvider>
      </WalletConnectContextProvider>
    </ThemeProvider>
  );
}

export default App;
