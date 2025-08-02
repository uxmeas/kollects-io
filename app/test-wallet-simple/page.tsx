'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Some known NFL All Day wallet addresses for testing
const TEST_WALLETS = [
  { address: "0xa2c60db5a2545622", name: "Real Wallet (92 moments)" },
  { address: "0x40f69697c82b7077", name: "Real Wallet (42 moments)" },
  { address: "0x8e45c2c41b09f2f8", name: "Test Wallet" },
];

export default function TestWalletSimple() {
  const router = useRouter();
  const [address, setAddress] = useState('');

  const handleNavigate = (walletAddress: string) => {
    router.push(`/collection/${walletAddress}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test NFL All Day Wallet (Simple)</h1>
        
        {/* Manual Address Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enter Wallet Address</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleNavigate(address)}
              disabled={!address.match(/^0x[a-fA-F0-9]{16}$/)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              View Collection
            </button>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test Wallets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEST_WALLETS.map((wallet) => (
              <button
                key={wallet.address}
                onClick={() => handleNavigate(wallet.address)}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <p className="font-medium">{wallet.name}</p>
                <p className="text-sm text-gray-600 break-all">{wallet.address}</p>
                <p className="text-sm text-blue-500 mt-2">Click to view →</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}