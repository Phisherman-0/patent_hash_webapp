import { Link, useLocation } from "wouter";
import {
  BarChart3,
  ChartLine,
  PlusCircle,
  DollarSign,
  Edit3,
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
  LogOut,
  Wallet,
  Calendar,
  MessageCircle,
  Users,
  UserCog,
  ChevronsUpDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logoutUser } from "@/store/authSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoLight from "../../assets/hash-logo.png";
import logoDark from "../../assets/hash-logo-inverted.png";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const getUserNavigationSections = (userRole: string): NavSection[] => {
  const commonSections: NavSection[] = [
    {
      title: "Dashboard",
      items: [
        { label: "Overview", icon: BarChart3, href: "/" },
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
  ];

  // Add role-specific sections
  if (userRole === "user") {
    commonSections.push({
      title: "Consulting",
      items: [
        { label: "Browse Consultants", icon: Users, href: "/consultants/browse" },
        { label: "My Appointments", icon: Calendar, href: "/consultants/appointments" },
        { label: "Messages", icon: MessageCircle, href: "/consultants/messages" },
      ],
    });
  }

  if (userRole === "consultant") {
    commonSections.push({
      title: "Consultant",
      items: [
        { label: "My Appointments", icon: Calendar, href: "/consultant/appointments" },
        { label: "Messages", icon: MessageCircle, href: "/consultant/messages" },
      ],
    });
  }

  if (userRole === "admin") {
    commonSections.push({
      title: "Administration",
      items: [
        { label: "User Management", icon: UserCog, href: "/admin/users" },
        { label: "Appointment Management", icon: Calendar, href: "/admin/appointments" },
      ],
    });
  }

  // Add account section for all users
  commonSections.push({
    title: "Account",
    items: [
      { label: "Profile", icon: User, href: "/profile" },
      { label: "Settings", icon: Settings, href: "/settings" },
      { label: "Wallet", icon: Wallet, href: "/wallet" },
    ],
  });

  return commonSections;
};

export function AppSidebar() {
  const [location] = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const navigationSections = user ? getUserNavigationSections(user.role) : [];

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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img src={logoLight} alt="PatentHash Logo" className="h-8 w-8 dark:hidden" />
          <img src={logoDark} alt="PatentHash Logo" className="h-8 w-8 hidden dark:block" />
          <span className="text-lg font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Patent Hash
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {navigationSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={isActive ? "!text-primary !bg-gray-100 dark:!bg-gray-800 hover:!bg-gray-100 dark:hover:!bg-gray-800" : ""}
                      >
                        <Link href={item.href}>
                          <Icon className={`h-4 w-4 ${isActive ? "!text-primary" : ""}`} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={
                        user?.profileImageUrl
                          ? `${import.meta.env.VITE_API_BASE_URL}${user.profileImageUrl}`
                          : ""
                      }
                      alt={user?.firstName || ""}
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wallet" className="cursor-pointer">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
