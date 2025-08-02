'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as fcl from '@onflow/fcl';
import { GET_NFL_MOMENTS } from '@/lib/flow/scripts';

// Some known NFL All Day wallet addresses for testing
const TEST_WALLETS = [
  { address: "0xa2c60db5a2545622", name: "Real Wallet (92 moments)" },
  { address: "0x40f69697c82b7077", name: "Real Wallet (42 moments)" },
  { address: "0x8e45c2c41b09f2f8", name: "Test Wallet" },
];

export default function TestWallet() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [moments, setMoments] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Configure FCL after component mounts
  useEffect(() => {
    fcl.config({
      "accessNode.api": "https://rest-mainnet.onflow.org",
      "flow.network": "mainnet"
    });
  }, []);

  const testWallet = async (walletAddress?: string) => {
    const targetAddress = walletAddress || address;
    
    if (!targetAddress || !targetAddress.match(/^0x[a-fA-F0-9]{16}$/)) {
      setError('Please enter a valid Flow address (0x + 16 hex characters)');
      return;
    }

    setLoading(true);
    setError('');
    setMoments([]);

    try {
      console.log('Testing wallet:', targetAddress);
      
      // Query the blockchain
      const momentIDs = await fcl.query({
        cadence: GET_NFL_MOMENTS,
        args: (arg: any, t: any) => [arg(targetAddress, t.Address)]
      });

      console.log('Found moments:', momentIDs);
      setMoments(momentIDs || []);
      setAddress(targetAddress); // Update address state for navigation
      
      if (!momentIDs || momentIDs.length === 0) {
        setError('No NFL All Day moments found in this wallet');
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test NFL All Day Wallet</h1>
        
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
              onClick={() => testWallet()}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Test Wallet'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Example: 0x8e45c2c41b09f2f8
          </p>
        </div>

        {/* Quick Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Test Wallets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEST_WALLETS.map((wallet) => (
              <div key={wallet.address} className="p-4 border rounded-lg">
                <p className="font-medium">{wallet.name}</p>
                <p className="text-sm text-gray-600 break-all mb-2">{wallet.address}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => testWallet(wallet.address)}
                    className="flex-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => router.push(`/collection/${wallet.address}`)}
                    className="flex-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {moments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Found {moments.length} NFL All Day Moments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {moments.slice(0, 12).map((momentId) => (
                <div key={momentId} className="border rounded p-4">
                  <p className="font-mono text-sm">ID: {momentId}</p>
                </div>
              ))}
              {moments.length > 12 && (
                <div className="border rounded p-4 bg-gray-50">
                  <p className="text-center">+{moments.length - 12} more...</p>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push(`/collection/${address || TEST_WALLETS.find(w => w.address === address)?.address}`)}
              className="mt-4 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              View Full Collection →
            </button>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 text-white rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              network: 'mainnet',
              accessNode: 'https://rest-mainnet.onflow.org',
              lastAddress: address || 'none',
              momentsFound: moments.length,
              status: loading ? 'loading' : 'idle'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}