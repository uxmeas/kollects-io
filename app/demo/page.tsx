'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Plus } from 'lucide-react';
import ManualPurchaseEntry from '@/components/ManualPurchaseEntry';

// Demo wallet with some NFL All Day moments
const DEMO_WALLET = '0x7b9e31ea81ad4924';
const DEMO_MOMENTS = [
  { 
    id: '123456', 
    player: 'Patrick Mahomes', 
    play: 'Touchdown Pass vs Bills', 
    series: 'Series 1',
    serial: '234/10000',
    imageUrl: '/api/placeholder/300/400'
  },
  { 
    id: '234567', 
    player: 'Justin Jefferson', 
    play: 'One-Handed Catch vs Packers', 
    series: 'Series 2',
    serial: '1234/40000',
    imageUrl: '/api/placeholder/300/400'
  },
  { 
    id: '345678', 
    player: 'Micah Parsons', 
    play: 'Game-Winning Sack vs Eagles', 
    series: 'Series 1',
    serial: '567/15000',
    imageUrl: '/api/placeholder/300/400'
  },
];

interface MomentData {
  id: string;
  player: string;
  play: string;
  series: string;
  serial: string;
  imageUrl: string;
  currentPrice?: number;
  purchasePrice?: number;
  purchaseDate?: string;
}

export default function DemoPage() {
  const [moments, setMoments] = useState<MomentData[]>(DEMO_MOMENTS);
  const [loading, setLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<string | null>(null);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  
  // Load saved purchase data from localStorage
  useEffect(() => {
    const loadedMoments = moments.map(moment => {
      const saved = localStorage.getItem(`purchase_${moment.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        return { ...moment, purchasePrice: data.price, purchaseDate: data.date };
      }
      return moment;
    });
    setMoments(loadedMoments);
  }, []);
  
  // Fetch current prices
  useEffect(() => {
    fetchCurrentPrices();
  }, []);
  
  const fetchCurrentPrices = async () => {
    setLoading(true);
    
    // Simulate fetching current market prices
    const updatedMoments = await Promise.all(
      moments.map(async (moment) => {
        try {
          const response = await fetch(`/api/prices/${moment.id}`);
          const data = await response.json();
          
          // For demo, use random prices if API returns null
          const currentPrice = data.price || (Math.random() * 200 + 50);
          
          return { ...moment, currentPrice };
        } catch (error) {
          // Fallback demo price
          return { ...moment, currentPrice: Math.random() * 200 + 50 };
        }
      })
    );
    
    setMoments(updatedMoments);
    setLoading(false);
    
    // Calculate totals
    const invested = updatedMoments.reduce((sum, m) => sum + (m.purchasePrice || 0), 0);
    const value = updatedMoments.reduce((sum, m) => sum + (m.currentPrice || 0), 0);
    setTotalInvested(invested);
    setTotalValue(value);
  };
  
  const handleSavePurchase = (momentId: string, data: { price: number; date: string }) => {
    setMoments(prev => prev.map(moment => 
      moment.id === momentId 
        ? { ...moment, purchasePrice: data.price, purchaseDate: data.date }
        : moment
    ));
    setShowPurchaseModal(null);
    
    // Recalculate totals
    setTimeout(() => {
      const invested = moments.reduce((sum, m) => sum + (m.purchasePrice || 0), 0);
      const value = moments.reduce((sum, m) => sum + (m.currentPrice || 0), 0);
      setTotalInvested(invested);
      setTotalValue(value);
    }, 100);
  };
  
  const profitLoss = totalValue - totalInvested;
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kollects.io Demo</h1>
              <p className="text-gray-600 mt-1">Track your NFL All Day investment performance</p>
            </div>
            <button
              onClick={fetchCurrentPrices}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Refresh Prices
            </button>
          </div>
        </div>
      </div>
      
      {/* Portfolio Summary */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalInvested.toFixed(2)}
                </p>
              </div>
              <DollarSign className="text-gray-400" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <Package className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit/Loss</p>
                <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(profitLoss).toFixed(2)}
                </p>
              </div>
              {profitLoss >= 0 ? (
                <TrendingUp className="text-green-500" size={24} />
              ) : (
                <TrendingDown className="text-red-500" size={24} />
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className={`text-2xl font-bold ${profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                profitLossPercent >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-lg font-bold ${
                  profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profitLossPercent >= 0 ? '↑' : '↓'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Moments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moments.map((moment) => {
            const profit = (moment.currentPrice || 0) - (moment.purchasePrice || 0);
            const profitPercent = moment.purchasePrice ? (profit / moment.purchasePrice) * 100 : 0;
            
            return (
              <div key={moment.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                  <img 
                    src={moment.imageUrl} 
                    alt={moment.player}
                    className="object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg">{moment.player}</h3>
                  <p className="text-sm text-gray-600 mb-2">{moment.play}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {moment.series} • Serial #{moment.serial}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Purchase Price:</span>
                      {moment.purchasePrice ? (
                        <span className="font-semibold">${moment.purchasePrice.toFixed(2)}</span>
                      ) : (
                        <button
                          onClick={() => setShowPurchaseModal(moment.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Price:</span>
                      <span className="font-semibold">
                        ${moment.currentPrice?.toFixed(2) || '---'}
                      </span>
                    </div>
                    
                    {moment.purchasePrice && moment.currentPrice && (
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-600">P/L:</span>
                        <div className="text-right">
                          <div className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                          </div>
                          <div className={`text-xs ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Add" to enter your purchase price for each moment</li>
            <li>• Current prices are fetched from NFL All Day marketplace</li>
            <li>• Your data is saved locally in your browser</li>
            <li>• Track your portfolio performance over time</li>
          </ul>
          <p className="text-sm text-blue-800 mt-3">
            <strong>Next steps:</strong> Connect your real wallet address to automatically import your collection!
          </p>
        </div>
      </div>
      
      {/* Purchase Entry Modal */}
      {showPurchaseModal && (
        <ManualPurchaseEntry
          momentId={showPurchaseModal}
          onSave={(data) => handleSavePurchase(showPurchaseModal, data)}
          onClose={() => setShowPurchaseModal(null)}
        />
      )}
    </div>
  );
}