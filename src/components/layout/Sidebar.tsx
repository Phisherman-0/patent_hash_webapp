import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  ChartLine, 
  PlusCircle, 
  DollarSign, 
  Edit3, 
  Search, 
  Folder, 
  ListChecks, 
  FileText, 
  Microscope, 
  Copy, 
  Tags, 
  Brain, 
  Shield, 
  UserCheck, 
  Award, 
  User, 
  Settings, 
  Fingerprint,
  LogOut,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/store/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "../../assets/ph white.png";

const navigationSections = [
  {
    title: "Dashboard",
    items: [
      { label: "Overview", icon: BarChart3, href: "/", active: true },
      { label: "Analytics", icon: ChartLine, href: "/analytics" },
    ],
  },
  {
    title: "Patenting",
    items: [
      { label: "File New Patent", icon: PlusCircle, href: "/patents/file" },
      { label: "AI Patent Valuation", icon: DollarSign, href: "/patents/valuation" },
      { label: "Drafting Assistant", icon: Edit3, href: "/patents/drafting" },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { label: "My Patents", icon: Folder, href: "/patents/my-patents" },
      { label: "Status Tracking", icon: ListChecks, href: "/patents/status" },
      { label: "Document Management", icon: FileText, href: "/patents/documents" },
    ],
  },
  {
    title: "AI Services",
    items: [
      { label: "Prior Art Search", icon: Microscope, href: "/ai/prior-art-search" },
      { label: "Similarity Detection", icon: Copy, href: "/ai/similarity" },
      { label: "Classification", icon: Tags, href: "/ai/classification" },
      { label: "Patent Analytics", icon: Brain, href: "/ai/analytics" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Blockchain Verification", icon: Shield, href: "/verification/blockchain" },
      { label: "Ownership Verification", icon: UserCheck, href: "/verification/ownership" },
      { label: "Patent Certificates", icon: Award, href: "/verification/certificates" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", icon: User, href: "/profile" },
      { label: "Settings", icon: Settings, href: "/settings" },
      { label: "Wallet", icon: Wallet, href: "/wallet" },
    ],
  },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export default function Sidebar({ className, onItemClick }: SidebarProps) {
  const [location] = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <aside className={cn("flex flex-col w-full md:w-80 bg-card border-r border-border shadow-sm h-full", className)} data-testid="sidebar">
      {/* Logo and Brand */}
      <div className="flex items-center justify-center h-16 px-4 md:px-6 bg-primary flex-shrink-0">
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center">
            <Fingerprint className="text-primary text-sm md:text-lg" />
          </div> */}
          <img src={logo} alt="PatentHash Logo" className="h-12 w-14 "/>
          <span className="text-white font-bold text-lg md:text-xl">Patent Hash</span>
        </div>
      </div>

      {/* Navigation Menu - Scrollable */}
      <nav className="flex-1 px-2 md:px-4 py-4 md:py-6 space-y-2 overflow-y-auto min-h-0 scrollbar-thin" data-testid="sidebar-nav">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-2 md:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("sidebar-nav-item", isActive && "active")}
                    onClick={onItemClick}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-2 md:mr-3 flex-shrink-0" size={16} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile at Bottom */}
      <div className="flex-shrink-0 border-t border-border p-3 md:p-4" data-testid="user-profile">
        <div className="flex items-center w-full">
          <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
            <AvatarImage src={user?.profileImageUrl ? `${import.meta.env.VITE_API_BASE_URL}${user.profileImageUrl}` : ""}
            alt={user?.firstName || ""} 
            />
            <AvatarFallback className="bg-primary text-white font-semibold text-xs md:text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-2 md:ml-3 flex-1 min-w-0">
            <p className="text-xs md:text-sm font-medium text-foreground truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate hidden md:block">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="ml-1 md:ml-2 text-muted-foreground hover:text-foreground p-1 md:p-2"
            data-testid="button-logout"
          >
            <LogOut size={14} className="md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
