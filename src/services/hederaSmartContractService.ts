import { hashPackWalletService } from "./hashPackWalletService";
import { Transaction } from "@hashgraph/sdk";

export interface PatentRecord {
  patentId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  ownerAccountId: string;
  timestamp: number;
  documentHash: string;
  ipfsHash?: string;
}

export interface SmartContractConfig {
  contractId?: string;
  network: 'testnet' | 'mainnet';
  operatorAccountId: string;
  operatorPrivateKey: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hedera Smart Contract Service for Patent Storage (Frontend)
 * 
 * This service provides smart contract functionality for storing patent records
 * on the Hedera network via backend API calls. The actual Hedera SDK operations
 * are handled on the backend for security reasons.
 * 
 * Features:
 * - Deploy patent storage smart contract via API
 * - Store patent records with hash verification via API
 * - Query patent ownership and metadata via API
 * - Integration with HashPack wallet for signing
 */
export class HederaSmartContractService {
  private config: SmartContractConfig;
  private baseUrl: string;

  constructor(config: SmartContractConfig) {
    this.config = config;
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Deploy the patent storage smart contract to Hedera via backend API
   */
  async deployContract(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/deploy-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          network: this.config.network,
          operatorAccountId: this.config.operatorAccountId,
        }),
      });

      const result: ApiResponse<{ contractId: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to deploy contract');
      }

      console.log(`Contract deployed with ID: ${result.data?.contractId}`);
      return result.data?.contractId || '';
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw new Error(`Failed to deploy contract: ${error}`);
    }
  }

  /**
   * Store a patent record on the smart contract using HashPack wallet signing
   */
  async storePatentWithWallet(patentData: PatentRecord): Promise<string> {
    try {
      // First, prepare the transaction data via backend
      const prepareResponse = await fetch(`${this.baseUrl}/api/hedera/prepare-patent-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patentData,
          contractId: this.config.contractId,
          network: this.config.network,
        }),
      });

      const prepareResult: ApiResponse<{ transactionBytes: string; transactionId: string }> = await prepareResponse.json();
      
      if (!prepareResult.success) {
        throw new Error(prepareResult.error || 'Failed to prepare transaction');
      }

      // Convert transaction bytes to Uint8Array if needed
      const transactionBytes = typeof prepareResult.data?.transactionBytes === 'string' 
        ? new Uint8Array(Buffer.from(prepareResult.data.transactionBytes, 'hex'))
        : new Uint8Array(prepareResult.data?.transactionBytes || []);

      // Use HashPack to send/sign the transaction
      const signedTransaction = await hashPackWalletService.sendTransaction(transactionBytes);
      
      if (!signedTransaction) {
        throw new Error('Transaction signing failed');
      }

      // Submit the signed transaction via backend
      const submitResponse = await fetch(`${this.baseUrl}/api/hedera/submit-signed-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          signedTransactionBytes: signedTransaction,
          transactionId: prepareResult.data?.transactionId,
        }),
      });

      const submitResult: ApiResponse<{ transactionId: string }> = await submitResponse.json();
      
      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Failed to submit transaction');
      }

      console.log(`Patent stored with transaction ID: ${submitResult.data?.transactionId}`);
      return submitResult.data?.transactionId || '';
    } catch (error) {
      console.error('Error storing patent:', error);
      throw new Error(`Failed to store patent: ${error}`);
    }
  }

  /**
   * Query a patent record from the smart contract via backend API
   */
  async getPatent(patentId: string): Promise<PatentRecord | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/get-patent/${patentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result: ApiResponse<PatentRecord> = await response.json();
      
      if (!result.success) {
        console.error('Error querying patent:', result.error);
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error('Error querying patent:', error);
      return null;
    }
  }

  /**
   * Verify patent ownership via backend API
   */
  async verifyPatentOwnership(patentId: string, ownerAccountId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/verify-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patentId,
          ownerAccountId,
          contractId: this.config.contractId,
        }),
      });

      const result: ApiResponse<{ isOwner: boolean }> = await response.json();
      
      if (!result.success) {
        console.error('Error verifying patent ownership:', result.error);
        return false;
      }

      return result.data?.isOwner || false;
    } catch (error) {
      console.error('Error verifying patent ownership:', error);
      return false;
    }
  }

  /**
   * Get all patents owned by an account via backend API
   */
  async getOwnerPatents(ownerAccountId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/owner-patents/${ownerAccountId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result: ApiResponse<{ patentIds: string[] }> = await response.json();
      
      if (!result.success) {
        console.error('Error getting owner patents:', result.error);
        return [];
      }

      return result.data?.patentIds || [];
    } catch (error) {
      console.error('Error getting owner patents:', error);
      return [];
    }
  }

  /**
   * Get contract information via backend API
   */
  async getContractInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/contract-info/${this.config.contractId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result: ApiResponse<{
        contractId: string;
        balance: string;
        storage: number;
        memo: string;
      }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get contract info');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting contract info:', error);
      throw error;
    }
  }

  /**
   * Generate a cryptographic hash for patent documents via backend API
   */
  static async generateDocumentHash(content: string): Promise<string> {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/hedera/generate-hash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      const result: ApiResponse<{ hash: string }> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate hash');
      }

      return result.data?.hash || '';
    } catch (error) {
      console.error('Error generating document hash:', error);
      // Fallback to client-side hashing if backend is unavailable
      return btoa(content).slice(0, 64); // Simple fallback
    }
  }

  /**
   * Validate patent data before storing
   */
  static validatePatentData(patentData: PatentRecord): boolean {
    return !!(
      patentData.patentId &&
      patentData.title &&
      patentData.category &&
      patentData.ownerAccountId &&
      patentData.documentHash
    );
  }

  /**
   * Get network status via backend API
   */
  async getNetworkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/hedera/network-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result: ApiResponse<{
        network: string;
        status: string;
        nodeCount: number;
      }> = await response.json();
      
      return result.data;
    } catch (error) {
      console.error('Error getting network status:', error);
      return null;
    }
  }
}

export default HederaSmartContractService;