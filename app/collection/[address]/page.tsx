'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PortfolioSummary from '@/components/PortfolioSummary';
import MomentCard from '@/components/MomentCard';
import MomentListView from '@/components/MomentListView';
import DenseListView from '@/components/DenseListView';
import { getAllPurchaseData, savePurchaseData } from '@/lib/storage/purchase-data';
import { scanMomentAcquisition } from '@/lib/flow/simple-event-scanner';
import { useWallet } from '@/contexts/WalletContext';

interface Moment {
  id: string;
  playID?: string;
  serialNumber?: string;
  mintingDate?: string;
  player?: {
    name: string;
    position: string;
    team: string;
  };
  playType?: string;
  description?: string;
  series?: string;
  alldayUrl?: string;
  imageUrl?: string;
  purchasePrice?: number;
  marketPrice?: number;
}

export default function CollectionPage() {
  const params = useParams();
  const address = params.address as string;
  const { user } = useWallet();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPurchasePrice, setTotalPurchasePrice] = useState(0);
  const [totalMarketValue, setTotalMarketValue] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [scanning, setScanning] = useState(false);
  
  const isOwnCollection = user?.addr === address;

  useEffect(() => {
    if (address) {
      fetchCollection();
    }
  }, [address]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      
      // Get user data from localStorage
      const userData = getAllPurchaseData(address);
      
      // Pass user data as query param
      const response = await fetch(`/api/wallet/${address}?userData=${encodeURIComponent(JSON.stringify(userData))}`);
      const data = await response.json();
      
      if (response.ok) {
        setMoments(data.moments || []);
        setTotalCount(data.totalCount || 0);
        setTotalPurchasePrice(data.totalPurchasePrice || 0);
        setTotalMarketValue(data.totalMarketValue || 0);
        setProfitLoss(data.profitLoss || 0);
      } else {
        setError(data.error || 'Failed to fetch collection');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  const scanTransactionHistory = async () => {
    try {
      setScanning(true);
      let scannedCount = 0;
      let purchaseCount = 0;
      let giftCount = 0;

      // Scan first 20 moments
      const momentsToScan = moments.slice(0, 20);
      
      for (const moment of momentsToScan) {
        try {
          const acquisition = await scanMomentAcquisition(address, moment.id);
          
          if (acquisition.acquisitionType === 'purchase' && acquisition.price) {
            // Save purchase data
            savePurchaseData(address, moment.id, {
              purchasePrice: acquisition.price,
              purchaseDate: acquisition.date || new Date().toISOString(),
              notes: `Auto-detected from blockchain (TX: ${acquisition.transactionId})`
            });
            purchaseCount++;
          } else if (acquisition.acquisitionType === 'gift') {
            // Mark as gift (0 cost)
            savePurchaseData(address, moment.id, {
              purchasePrice: 0,
              purchaseDate: acquisition.date || new Date().toISOString(),
              notes: `Gift/Transfer from ${acquisition.seller || 'unknown'}`
            });
            giftCount++;
          }
          
          scannedCount++;
        } catch (err) {
          console.error(`Failed to scan moment ${moment.id}:`, err);
        }
      }

      alert(`Scan complete!\n\nScanned: ${scannedCount} moments\nPurchases found: ${purchaseCount}\nGifts found: ${giftCount}\n\nNote: This is using mock data. Real implementation would scan actual blockchain events.`);
      
      // Refresh the collection
      await fetchCollection();
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan transaction history');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
            ← Back
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">NFL All Day Collection</h1>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-gray-600">Wallet: {address}</p>
              <p className="text-lg mt-1">Total Moments: {totalCount}</p>
            </div>
            {isOwnCollection && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Your Collection
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle and Actions */}
        {moments.length > 0 && (
          <div className="flex justify-between mb-4">
            <button
              onClick={scanTransactionHistory}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              disabled={scanning}
            >
              {scanning ? 'Scanning Blockchain...' : 'Scan Transaction History'}
            </button>
            <div>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 text-sm ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r`}
              >
                Card View
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Summary - Show basic stats for now */}
        {moments.length > 0 && viewMode === 'card' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Collection Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Moments</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Spent</p>
                <p className="text-2xl font-bold">${(totalPurchasePrice || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Current FMV</p>
                <p className="text-2xl font-bold">${(totalMarketValue || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Difference</p>
                <p className={`text-2xl font-bold ${(profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(profitLoss || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {moments.length === 0 ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            No NFL All Day moments found in this wallet.
          </div>
        ) : viewMode === 'list' ? (
          <DenseListView 
            moments={moments} 
            walletAddress={address}
            onDataUpdate={fetchCollection}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {moments.map((moment) => (
              <MomentCard key={moment.id} moment={moment} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>For entertainment and tracking purposes only. Not financial advice.</p>
        </div>
      </div>
    </div>
  );
}