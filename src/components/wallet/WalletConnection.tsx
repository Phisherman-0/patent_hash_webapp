import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletSelectionDialog } from "./WalletSelectionDialog";
import { WalletConnectContext } from "@/contexts/WalletConnectContext";
import { useContext } from "react";

export const WalletConnection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { accountId, isConnected } = useContext(WalletConnectContext);

  const handleConnect = () => {
    setIsDialogOpen(true);
  };

  const handleDisconnect = () => {
    // This would be handled by the WalletConnectClient component
    window.location.reload(); // Simple refresh for now
  };

  if (isConnected && accountId) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Connected</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {accountId}
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={handleConnect} variant="default">
        Connect Wallet
      </Button>
      <WalletSelectionDialog
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};