import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Creating patent...", 
  className 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/70 backdrop-blur-sm",
        "transition-all duration-300",
        className
      )}
      data-testid="loading-overlay"
    >
      <div className="flex flex-col items-center space-y-4 text-white">
        <Loader2 
          className="h-12 w-12 animate-spin text-orange-500" 
          data-testid="loading-spinner"
        />
        <div className="text-lg font-medium" data-testid="loading-message">
          {message}
        </div>
        <div className="text-sm text-gray-300">
          Please wait while we process your request
        </div>
      </div>
    </div>
  );
}
