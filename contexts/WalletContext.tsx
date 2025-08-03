'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as fcl from '@onflow/fcl';
import { configureFCL } from '@/lib/flow/fcl-config';

interface User {
  addr: string;
  cid: string;
  loggedIn: boolean;
}

interface WalletContextType {
  user: User | null;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Configure FCL
    configureFCL();
    
    // Subscribe to auth state changes
    const unsubscribe = fcl.currentUser.subscribe(setUser);
    
    // Check initial auth state
    setIsLoading(false);
    
    return () => unsubscribe();
  }, []);

  const connect = async () => {
    setIsLoading(true);
    try {
      await fcl.authenticate();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    try {
      await fcl.unauthenticate();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider value={{ user, isLoading, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}