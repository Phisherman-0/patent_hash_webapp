export interface MirrorNodeAccountInfo {
  account: string;
  balance: {
    balance: number;
    timestamp: string;
  };
  tokens: Array<{
    token_id: string;
    balance: number;
  }>;
}

export interface MirrorNodeTransactionInfo {
  transaction_id: string;
  consensus_timestamp: string;
  result: string;
  transfers: Array<{
    account: string;
    amount: number;
  }>;
}

export class MirrorNodeClient {
  private baseUrl: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.baseUrl = network === 'mainnet' 
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
  }

  async getAccountInfo(accountId: string): Promise<MirrorNodeAccountInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/accounts/${accountId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  async getAccountBalance(accountId: string): Promise<number | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/balances?account.id=${accountId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.balances?.[0]?.balance || 0;
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return null;
    }
  }

  async getTransactionInfo(transactionId: string): Promise<MirrorNodeTransactionInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/transactions/${transactionId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.transactions?.[0] || null;
    } catch (error) {
      console.error('Error fetching transaction info:', error);
      return null;
    }
  }

  async getAccountTransactions(accountId: string, limit: number = 10): Promise<MirrorNodeTransactionInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.transactions || [];
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      return [];
    }
  }
}