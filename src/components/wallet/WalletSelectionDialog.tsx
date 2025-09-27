import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { openWalletConnectModal } from "@/services/wallets/walletConnectClient";

interface WalletSelectionDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  onClose: (value: string) => void;
}

export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              openWalletConnectModal();
              setOpen(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">WC</span>
            </div>
            WalletConnect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};