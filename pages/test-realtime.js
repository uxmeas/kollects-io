import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import Navigation from '../components/Navigation';

export default function TestRealtime() {
  const [walletAddress, setWalletAddress] = useState('0x40f69697c82b7077');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const { 
    data, 
    isConnected: wsConnected, 
    error, 
    lastUpdate: wsLastUpdate,
    sendPing 
  } = useWebSocket(walletAddress);

  useEffect(() => {
    setIsConnected(wsConnected);
    if (wsLastUpdate) {
      setLastUpdate(wsLastUpdate);
    }
  }, [wsConnected, wsLastUpdate]);

  const handleWalletChange = (e) => {
    setWalletAddress(e.target.value);
  };

  const handlePing = () => {
    sendPing();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Navigation />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          📊 Real-Time Portfolio Dashboard
        </h1>

        {/* Connection Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className="text-sm text-gray-300">WebSocket Status</div>
              <div className={`text-lg font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
            
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Last Update</div>
              <div className="text-lg font-bold text-blue-400">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
            
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Cache Type</div>
              <div className="text-lg font-bold text-purple-400">
                In-Memory (Fallback)
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Input */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Wallet Configuration</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={walletAddress}
              onChange={handleWalletChange}
              placeholder="Enter Flow wallet address"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
            />
            <button
              onClick={handlePing}
              className="px-6 py-2 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors"
            >
              Ping
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="text-red-300 font-medium">Connection Error</div>
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        {/* Portfolio Data */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Portfolio Data</h2>
          {data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Total Moments</div>
                  <div className="text-2xl font-bold text-kollects-gold">
                    {data.portfolio?.totalMoments || 0}
                  </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Portfolio Value</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${data.portfolio?.totalValue || 0}
                  </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Last Updated</div>
                  <div className="text-sm font-bold text-blue-400">
                    {data.portfolio?.lastUpdated ? new Date(data.portfolio.lastUpdated).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">NBA Top Shot</h3>
                  <div className="text-2xl font-bold text-blue-400">
                    {data.topShotCollection?.length || 0} moments
                  </div>
                  {data.topShotCollection?.slice(0, 5).map((moment, index) => (
                    <div key={index} className="text-sm text-gray-300 mt-1">
                      ID: {moment.id} - ${moment.estimatedValue}
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">NFL All Day</h3>
                  <div className="text-2xl font-bold text-orange-400">
                    {data.allDayCollection?.length || 0} moments
                  </div>
                  {data.allDayCollection?.slice(0, 5).map((moment, index) => (
                    <div key={index} className="text-sm text-gray-300 mt-1">
                      ID: {moment.id} - ${moment.estimatedValue}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kollects-gold mx-auto mb-4"></div>
              <div>Loading portfolio data...</div>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Cache Strategy</div>
              <div className="text-white">Redis with In-Memory Fallback</div>
            </div>
            <div>
              <div className="text-gray-300">Update Frequency</div>
              <div className="text-white">Every 30 seconds</div>
            </div>
            <div>
              <div className="text-gray-300">WebSocket Transport</div>
              <div className="text-white">WebSocket + Polling Fallback</div>
            </div>
            <div>
              <div className="text-gray-300">Blockchain Endpoint</div>
              <div className="text-white">QuickNode Flow</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 