'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WalletButton from '@/components/WalletButton';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const [address, setAddress] = useState('');
  const router = useRouter();
  const { user } = useWallet();
  
  // If user is connected, redirect to their collection
  useEffect(() => {
    if (user?.loggedIn && user?.addr) {
      router.push(`/collection/${user.addr}`);
    }
  }, [user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address && address.match(/^0x[a-fA-F0-9]+$/)) {
      router.push(`/collection/${address}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          NFL All Day Portfolio Tracker
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Track your NFL All Day collection on the Flow blockchain
        </p>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-4">
              Connect with your Dapper, Blocto, or Lilico wallet to view your NFL All Day collection.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>🔒 Secure Authentication:</strong> We never see your password or private keys. 
                Authentication happens directly with your wallet provider.
              </p>
            </div>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
          
          <div className="text-center my-4 text-gray-500">— OR —</div>
          
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">View Any Wallet</h2>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter Flow wallet address (0x...)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit"
              className="w-full mt-4 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-800 transition"
            >
              View Collection
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/test-wallet')}
            className="text-blue-500 hover:underline"
          >
            Test with sample wallets →
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          For entertainment and tracking purposes only. Not financial advice.
        </div>
      </div>
    </main>
  );
}