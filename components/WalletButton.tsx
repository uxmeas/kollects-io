'use client';

import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

export default function WalletButton() {
  const { user, isLoading, connect, disconnect } = useWallet();
  const router = useRouter();

  const handleConnect = async () => {
    await connect();
    // After connecting, redirect to user's collection
    if (user?.addr) {
      router.push(`/collection/${user.addr}`);
    }
  };

  if (isLoading) {
    return (
      <button className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    );
  }

  if (user?.loggedIn) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/collection/${user.addr}`)}
          className="text-gray-700 hover:text-gray-900 text-sm"
        >
          {user.addr.slice(0, 6)}...{user.addr.slice(-4)}
        </button>
        <button
          onClick={disconnect}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </button>
  );
}