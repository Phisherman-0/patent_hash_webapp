import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Header() {
  const [location] = useLocation();

  const getBreadcrumbs = () => {
    const pathMap: Record<string, { label: string; parent?: string }> = {
      "/": { label: "Dashboard Overview" },
      "/analytics": { label: "Analytics", parent: "/" },
      "/patents/file": { label: "File New Patent", parent: "/" },
      "/patents/my-patents": { label: "My Patents", parent: "/" },
      "/patents/valuation": { label: "Patent Valuation", parent: "/" },
      "/patents/drafting": { label: "Patent Drafting", parent: "/" },
      "/patents/status": { label: "Status Tracking", parent: "/" },
      "/patents/documents": { label: "Document Management", parent: "/" },
      "/ai/prior-art-search": { label: "Prior Art Search", parent: "/" },
      "/ai/similarity": { label: "Similarity Detection", parent: "/" },
      "/ai/classification": { label: "Classification", parent: "/" },
      "/ai/analytics": { label: "Patent Analytics", parent: "/" },
      "/verification/blockchain": { label: "Blockchain Verification", parent: "/" },
      "/verification/ownership": { label: "Ownership Verification", parent: "/" },
      "/verification/certificates": { label: "Patent Certificates", parent: "/" },
      "/profile": { label: "Profile", parent: "/" },
      "/settings": { label: "Settings", parent: "/" },
      "/wallet": { label: "Wallet", parent: "/" },
      "/consultants/browse": { label: "Browse Consultants", parent: "/" },
      "/consultants/appointments": { label: "My Appointments", parent: "/" },
      "/consultants/messages": { label: "Messages", parent: "/" },
      "/consultant/appointments": { label: "My Appointments", parent: "/" },
      "/consultant/messages": { label: "Messages", parent: "/" },
      "/admin/users": { label: "User Management", parent: "/" },
      "/admin/appointments": { label: "Appointment Management", parent: "/" },
    };

    const current = pathMap[location];
    if (!current) return null;

    const breadcrumbs = [];
    
    // Add parent if exists
    if (current.parent && pathMap[current.parent]) {
      breadcrumbs.push({
        label: pathMap[current.parent].label,
        href: current.parent,
      });
    }

    // Add current page
    breadcrumbs.push({
      label: current.label,
      href: location,
      isCurrent: true,
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isCurrent ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      <div className="flex items-center gap-2">
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
    </header>
  );
}
