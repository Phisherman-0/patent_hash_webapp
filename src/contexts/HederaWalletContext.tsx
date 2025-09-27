import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useHashPackWallet } from '@/contexts/HashPackWalletContext';
import { AccountId, TokenId, ContractId, TransactionId, TransferTransaction, TokenAssociateTransaction, ContractExecuteTransaction } from '@hashgraph/sdk';
import { ContractFunctionParameterBuilder } from '@/services/wallets/contractFunctionParameterBuilder';
import { MirrorNodeClient } from '@/services/wallets/mirrorNodeClient';

export interface HederaWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  balance?: number;
  isConnected: boolean;
}

interface HederaWalletContextType {
  walletInfo: HederaWalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  connect: (network?: 'testnet' | 'mainnet') => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Transaction methods
  transferHBAR: (toAddress: string, amount: number) => Promise<TransactionId | null>;
  transferFungibleToken: (toAddress: string, tokenId: string, amount: number) => Promise<TransactionId | null>;
  transferNonFungibleToken: (toAddress: string, tokenId: string, serialNumber: number) => Promise<TransactionId | null>;
  associateToken: (tokenId: string) => Promise<TransactionId | null>;
  executeContractFunction: (contractId: string, functionName: string, functionParameters: ContractFunctionParameterBuilder, gasLimit: number) => Promise<TransactionId | null>;
  
  // Utility methods
  getAccountBalance: () => Promise<number | null>;
  getAccountInfo: () => Promise<any>;
  refreshBalance: () => Promise<void>;
}

const HederaWalletContext = createContext<HederaWalletContextType | undefined>(undefined);

export function HederaWalletProvider({ children }: { children: ReactNode }) {
  const { 
    walletInfo: hashPackWalletInfo, 
    connectionState, 
    isConnecting: isHashPackConnecting, 
    error: hashPackError,
    connect: connectHashPack,
    disconnect: disconnectHashPack,
    sendTransaction
  } = useHashPackWallet();
  
  const [walletInfo, setWalletInfo] = useState<HederaWalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mirrorNodeClient, setMirrorNodeClient] = useState<MirrorNodeClient | null>(null);

  // Initialize mirror node client based on network
  useEffect(() => {
    if (hashPackWalletInfo?.network) {
      const client = new MirrorNodeClient(hashPackWalletInfo.network);
      setMirrorNodeClient(client);
    }
  }, [hashPackWalletInfo?.network]);

  // Update wallet info when HashPack connection state changes
  useEffect(() => {
    if (hashPackWalletInfo?.isConnected && hashPackWalletInfo.accountId) {
      const newWalletInfo: HederaWalletInfo = {
        accountId: hashPackWalletInfo.accountId,
        network: hashPackWalletInfo.network,
        isConnected: true,
      };
      setWalletInfo(newWalletInfo);
      setError(hashPackError);
      
      // Fetch balance
      refreshBalance();
    } else {
      setWalletInfo(null);
    }
  }, [hashPackWalletInfo, hashPackError]);

  const connect = async (network: 'testnet' | 'mainnet' = 'testnet') => {
    try {
      await connectHashPack(network);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    }
  };

  const disconnect = async () => {
    try {
      await disconnectHashPack();
      setWalletInfo(null);
      setError(null);
    } catch (err: any) {
      console.error('Failed to disconnect wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
      throw err;
    }
  };

  const transferHBAR = async (toAddress: string, amount: number): Promise<TransactionId | null> => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(walletInfo.accountId, -amount)
        .addHbarTransfer(toAddress, amount);
        
      return await sendTransaction(transferTransaction);
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
      throw err;
    }
  };

  const transferFungibleToken = async (toAddress: string, tokenId: string, amount: number): Promise<TransactionId | null> => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const transferTransaction = new TransferTransaction()
        .addTokenTransfer(tokenIdObj, walletInfo.accountId, -amount)
        .addTokenTransfer(tokenIdObj, toAddress, amount);
        
      return await sendTransaction(transferTransaction);
    } catch (err: any) {
      setError(err.message || 'Token transfer failed');
      throw err;
    }
  };

  const transferNonFungibleToken = async (toAddress: string, tokenId: string, serialNumber: number): Promise<TransactionId | null> => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const transferTransaction = new TransferTransaction()
        .addNftTransfer(tokenIdObj, serialNumber, walletInfo.accountId, toAddress);
        
      return await sendTransaction(transferTransaction);
    } catch (err: any) {
      setError(err.message || 'NFT transfer failed');
      throw err;
    }
  };

  const associateToken = async (tokenId: string): Promise<TransactionId | null> => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const tokenIdObj = TokenId.fromString(tokenId);
      const associateTransaction = new TokenAssociateTransaction()
        .setAccountId(walletInfo.accountId)
        .setTokenIds([tokenIdObj]);
        
      return await sendTransaction(associateTransaction);
    } catch (err: any) {
      setError(err.message || 'Token association failed');
      throw err;
    }
  };

  const executeContractFunction = async (
    contractId: string, 
    functionName: string, 
    functionParameters: ContractFunctionParameterBuilder, 
    gasLimit: number
  ): Promise<TransactionId | null> => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const contractIdObj = ContractId.fromString(contractId);
      const contractTransaction = new ContractExecuteTransaction()
        .setContractId(contractIdObj)
        .setGas(gasLimit)
        .setFunction(functionName, functionParameters.buildHAPIParams());
        
      return await sendTransaction(contractTransaction);
    } catch (err: any) {
      setError(err.message || 'Contract execution failed');
      throw err;
    }
  };

  const getAccountBalance = async (): Promise<number | null> => {
    if (!walletInfo?.accountId || !mirrorNodeClient) return null;
    
    try {
      return await mirrorNodeClient.getAccountBalance(walletInfo.accountId);
    } catch (err: any) {
      console.error('Failed to get account balance:', err);
      return null;
    }
  };

  const getAccountInfo = async () => {
    if (!walletInfo?.accountId || !mirrorNodeClient) return null;
    
    try {
      return await mirrorNodeClient.getAccountInfo(walletInfo.accountId);
    } catch (err: any) {
      console.error('Failed to get account info:', err);
      return null;
    }
  };

  const refreshBalance = async () => {
    if (!walletInfo || !mirrorNodeClient) return;
    
    try {
      const balance = await getAccountBalance();
      if (balance !== null) {
        setWalletInfo(prev => prev ? { ...prev, balance } : null);
      }
    } catch (err: any) {
      console.error('Failed to refresh balance:', err);
    }
  };

  const value = {
    walletInfo,
    isConnecting: isHashPackConnecting,
    error,
    connect,
    disconnect,
    transferHBAR,
    transferFungibleToken,
    transferNonFungibleToken,
    associateToken,
    executeContractFunction,
    getAccountBalance,
    getAccountInfo,
    refreshBalance,
  };

  return (
    <HederaWalletContext.Provider value={value}>
      {children}
    </HederaWalletContext.Provider>
  );
}

export function useHederaWallet() {
  const context = useContext(HederaWalletContext);
  if (context === undefined) {
    throw new Error('useHederaWallet must be used within a HederaWalletProvider');
  }
  return context;
}