import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import React from 'react';

const config = getDefaultConfig({
  appName: 'Patent Hash Base App',
  projectId: '21074e0d4a9cfd1cc7cf46fbdf5ba723', // WalletConnect Project ID
  chains: [baseSepolia, base],
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
