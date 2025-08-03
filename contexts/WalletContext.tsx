'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as fcl from '@onflow/fcl';
import { configureFCL } from '@/lib/flow/fcl-config';

interface User {
  addr?: string;
  cid?: string;
  loggedIn?: boolean;
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
    const unsubscribe = fcl.currentUser.subscribe((currentUser: any) => {
      if (currentUser.loggedIn) {
        setUser({
          addr: currentUser.addr || '',
          cid: currentUser.cid || '',
          loggedIn: true
        });
      } else {
        setUser(null);
      }
    });
    
    // Check initial auth state
    setIsLoading(false);
    
    return () => unsubscribe();
  }, []);

  const connect = async () => {
    setIsLoading(true);
    try {
      // Direct authentication with Dapper Wallet
      await fcl.authenticate({
        service: 'https://accounts.meetdapper.com/fcl/authn',
      });
    } catch (error) {
      console.error('Failed to connect Dapper wallet:', error);
      // If user doesn't have Dapper, show helpful message
      if (error instanceof Error && error.message.includes('User rejected')) {
        alert('Please make sure you have a Dapper wallet account. Visit nflallday.com to create one.');
      }
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