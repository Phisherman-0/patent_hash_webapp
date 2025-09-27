export const hederaConfig = {
  networks: {
    testnet: {
      network: 'testnet' as const,
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
      chainId: 'testnet',
    },
    mainnet: {
      network: 'mainnet' as const,
      mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
      chainId: 'mainnet',
    },
  },
  walletConnect: {
    projectId: '622decdfdee10fe9c3088d8d2a4de131',
    metadata: {
      name: 'Patent Hash',
      description: 'Patent Hash - Blockchain Patent Management System',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
      icons: [typeof window !== 'undefined' ? window.location.origin + '/ph-orange.png' : '/favicon.ico'],
    },
  },
  defaultNetwork: 'testnet' as const,
};