import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletStatus } from "@/components/wallet/WalletStatus";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const [location] = useLocation();

  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard Overview',
      '/analytics': 'Analytics',
      '/patents/file': 'File New Patent',
      '/patents/my-patents': 'My Patents',
      '/patents/valuation': 'Patent Valuation',
      '/patents/drafting': 'Patent Drafting',
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
      'Wallet': 'Wallet',
      '/wallet': 'Wallet',
    };
    
    return pathMap[location] || 'Patent Hash';
  };


  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="flex items-center justify-between px-3 md:px-6 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="lg:hidden mr-4 text-muted-foreground"
          >
            <Menu size={20} />
          </Button>
          <h1 className="hidden md:block text-2xl font-bold text-foreground">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Wallet Status */}
          <WalletStatus />

          {/* Theme Toggle */}
          <ThemeToggle />


          {/* Quick Actions */}
          <Link href="/patents/file">
            <Button className="bg-primary hover:bg-primary-dark text-white px-2 py-2 md:px-4 rounded-lg font-medium transition-colors">
              <Plus size={16} className="mr-0 md:mr-2" />
              <span className="hidden md:inline">New Patent</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
