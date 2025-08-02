'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address && address.match(/^0x[a-fA-F0-9]{16}$/)) {
      router.push(`/collection/${address}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          Kollects.io
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Track your NFL All Day collection on the Flow blockchain
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Flow wallet address (0x...)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
          >
            View Collection
          </button>
        </form>
        
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