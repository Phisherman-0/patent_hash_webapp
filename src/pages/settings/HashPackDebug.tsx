import { DirectHashPackTest } from "@/components/wallet/DirectHashPackTest";
import { HashPackDebugger } from "@/components/wallet/HashPackDebugger";
import { HashPackMessageDebugger } from "@/components/wallet/HashPackMessageDebugger";
import { HashPackWebWalletTester } from "@/components/wallet/HashPackWebWalletTester";

export default function HashPackDebug() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HashPack Debug</h1>
          <p className="text-muted-foreground">
            Debug and test HashPack web wallet integration
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <HashPackWebWalletTester />
        <DirectHashPackTest />
        <HashPackMessageDebugger />
        <HashPackDebugger />
      </div>
    </div>
  );
}