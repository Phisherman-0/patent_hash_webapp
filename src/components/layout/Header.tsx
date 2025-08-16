import { useState } from "react";
import { Search, Bell, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard Overview',
      '/analytics': 'Analytics',
      '/patents/file': 'File New Patent',
      '/patents/my-patents': 'My Patents',
      '/patents/valuation': 'Patent Valuation',
      '/patents/drafting': 'Patent Drafting',
      '/patents/verify': 'Quick Verification',
      '/patents/status': 'Status Tracking',
      '/patents/documents': 'Document Management',
      '/ai/prior-art-search': 'Prior Art Search',
      '/ai/similarity': 'Similarity Detection',
      '/ai/classification': 'Classification',
      '/ai/analytics': 'Patent Analytics',
      '/verification/blockchain': 'Blockchain Verification',
      '/verification/ownership': 'Ownership Verification',
      '/verification/certificates': 'Patent Certificates',
      '/profile': 'Profile',
      '/settings': 'Settings',
    };
    
    return pathMap[location] || 'Patent Hash';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden mr-4 text-gray-500"
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search patents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </form>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell size={20} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
          </Button>

          {/* Quick Actions */}
          <Link href="/patents/file">
            <Button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Plus size={16} className="mr-2" />
              New Patent
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
