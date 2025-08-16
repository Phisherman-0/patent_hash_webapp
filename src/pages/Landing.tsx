import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Shield, Brain, Zap, Users, Globe } from "lucide-react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { clearUser } from "@/store/authSlice";

export default function Landing() {
  const dispatch = useAppDispatch();
  
  const handleLogin = () => {
    dispatch(clearUser());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Fingerprint className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Patent Hash</span>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary-dark">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Protect Your Innovation with
              <span className="text-primary block">Blockchain-Powered Patents</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The world's first AI-driven patent management platform using Hedera blockchain technology. 
              Secure your intellectual property, discover prior art, and manage your patent portfolio with enterprise-grade tools.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-white px-8 py-3"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Patent Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From filing to verification, our comprehensive platform handles every aspect of intellectual property protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-primary" size={24} />
                </div>
                <CardTitle>Blockchain Security</CardTitle>
                <CardDescription>
                  Immutable proof-of-existence using Hedera consensus service with enterprise-grade security.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="text-blue-600" size={24} />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced prior art search, similarity detection, and automated patent valuation using cutting-edge AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="text-green-600" size={24} />
                </div>
                <CardTitle>Instant Verification</CardTitle>
                <CardDescription>
                  Real-time patent verification and ownership confirmation through decentralized ledger technology.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-purple-600" size={24} />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Collaborative patent management with role-based access control and real-time status updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="text-yellow-600" size={24} />
                </div>
                <CardTitle>Global Coverage</CardTitle>
                <CardDescription>
                  Cross-border patent verification and international patent database integration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Fingerprint className="text-red-600" size={24} />
                </div>
                <CardTitle>NFT Ownership</CardTitle>
                <CardDescription>
                  Represent patent ownership as NFTs with smart contracts for automated licensing and royalties.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Revolutionize Your Patent Strategy?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join innovative companies already using Patent Hash to protect and monetize their intellectual property.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100 px-8 py-3"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Fingerprint className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold">Patent Hash</span>
            </div>
            <p className="text-gray-400">
              Securing innovation through blockchain technology
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
