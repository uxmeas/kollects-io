import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';

export default function PortfolioView({ walletAddress }) {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { 
    data, 
    isConnected: wsConnected, 
    error: wsError, 
    lastUpdate: wsLastUpdate
  } = useWebSocket(walletAddress);

  useEffect(() => {
    if (data) {
      setPortfolioData(data);
      setLoading(false);
      // Cache the data locally for faster loading
      try {
        localStorage.setItem(`portfolio-${walletAddress}`, JSON.stringify(data));
      } catch (error) {
        console.error('Error caching portfolio data:', error);
      }
    }
  }, [data, walletAddress]);

  // Show cached data immediately if available
  useEffect(() => {
    const cachedData = localStorage.getItem(`portfolio-${walletAddress}`);
    if (cachedData && !portfolioData) {
      try {
        const parsed = JSON.parse(cachedData);
        setPortfolioData(parsed);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing cached portfolio data:', error);
      }
    }
  }, [walletAddress, portfolioData]);

  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  // Enhanced moment data with real details
  const getMomentDetails = (momentId, collection) => {
    // This would normally come from the blockchain or API
    // For now, we'll simulate realistic NBA Top Shot and NFL All Day data
    const mockData = {
      // NBA Top Shot moments
      '123456': {
        player: 'LeBron James',
        team: 'Los Angeles Lakers',
        play: 'Dunk over defender',
        series: 'Series 2',
        tier: 'Common',
        estimatedValue: 150,
        image: '🏀'
      },
      '789012': {
        player: 'Stephen Curry',
        team: 'Golden State Warriors',
        play: '3-pointer from deep',
        series: 'Series 3',
        tier: 'Rare',
        estimatedValue: 300,
        image: '🏀'
      },
      '345678': {
        player: 'Giannis Antetokounmpo',
        team: 'Milwaukee Bucks',
        play: 'Block at the rim',
        series: 'Series 2',
        tier: 'Common',
        estimatedValue: 120,
        image: '🏀'
      },
      // NFL All Day moments
      '111111': {
        player: 'Patrick Mahomes',
        team: 'Kansas City Chiefs',
        play: 'Touchdown pass',
        series: 'Series 1',
        tier: 'Legendary',
        estimatedValue: 500,
        image: '🏈'
      },
      '222222': {
        player: 'Derrick Henry',
        team: 'Tennessee Titans',
        play: 'Power run for TD',
        series: 'Series 1',
        tier: 'Rare',
        estimatedValue: 250,
        image: '🏈'
      },
      '333333': {
        player: 'Aaron Rodgers',
        team: 'Green Bay Packers',
        play: 'Perfect completion',
        series: 'Series 2',
        tier: 'Common',
        estimatedValue: 180,
        image: '🏈'
      }
    };

    return mockData[momentId] || {
      player: 'Unknown Player',
      team: 'Unknown Team',
      play: 'Moment details unavailable',
      series: 'Unknown Series',
      tier: 'Unknown',
      estimatedValue: 100,
      image: collection === 'topShot' ? '🏀' : '🏈'
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Portfolio...</h2>
          <p className="text-gray-300">Fetching your NFT collection</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
        <div className="text-red-300 font-medium">Error Loading Portfolio</div>
        <div className="text-red-200 text-sm">{error}</div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="text-center text-white">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">No Portfolio Data</h2>
        <p className="text-gray-300">Connect your wallet to view your NFT collection</p>
      </div>
    );
  }

  const totalValue = (portfolioData.topShotCollection || []).reduce((sum, moment) => {
    const details = getMomentDetails(moment.id, 'topShot');
    return sum + details.estimatedValue;
  }, 0) + (portfolioData.allDayCollection || []).reduce((sum, moment) => {
    const details = getMomentDetails(moment.id, 'allDay');
    return sum + details.estimatedValue;
  }, 0);

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Total Value</div>
            <div className="text-2xl font-bold text-kollects-gold">${totalValue.toLocaleString()}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Total Moments</div>
            <div className="text-2xl font-bold text-blue-400">
              {(portfolioData.topShotCollection?.length || 0) + (portfolioData.allDayCollection?.length || 0)}
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">NBA Top Shot</div>
            <div className="text-2xl font-bold text-orange-400">{portfolioData.topShotCollection?.length || 0}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">NFL All Day</div>
            <div className="text-2xl font-bold text-green-400">{portfolioData.allDayCollection?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* NBA Top Shot Collection */}
      {portfolioData.topShotCollection && portfolioData.topShotCollection.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🏀</span>
            NBA Top Shot Collection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioData.topShotCollection.map((moment, index) => {
              const details = getMomentDetails(moment.id, 'topShot');
              return (
                <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-kollects-gold/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{details.image}</div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">#{moment.id}</div>
                      <div className="text-xs text-gray-500">{details.tier}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-white">{details.player}</div>
                    <div className="text-sm text-gray-300">{details.team}</div>
                    <div className="text-sm text-gray-400 italic">"{details.play}"</div>
                    <div className="text-xs text-gray-500">{details.series}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm text-gray-300">Est. Value:</span>
                      <span className="font-bold text-kollects-gold">${details.estimatedValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NFL All Day Collection */}
      {portfolioData.allDayCollection && portfolioData.allDayCollection.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">🏈</span>
            NFL All Day Collection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioData.allDayCollection.map((moment, index) => {
              const details = getMomentDetails(moment.id, 'allDay');
              return (
                <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10 hover:border-kollects-gold/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{details.image}</div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">#{moment.id}</div>
                      <div className="text-xs text-gray-500">{details.tier}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-white">{details.player}</div>
                    <div className="text-sm text-gray-300">{details.team}</div>
                    <div className="text-sm text-gray-400 italic">"{details.play}"</div>
                    <div className="text-xs text-gray-500">{details.series}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-sm text-gray-300">Est. Value:</span>
                      <span className="font-bold text-kollects-gold">${details.estimatedValue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Connection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${wsConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="text-sm text-gray-300">WebSocket Status</div>
            <div className={`text-lg font-bold ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
              {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
          <div className="bg-blue-500/20 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Last Update</div>
            <div className="text-lg font-bold text-blue-400">
              {wsLastUpdate ? wsLastUpdate.toLocaleTimeString() : 'Never'}
            </div>
          </div>
          <div className="bg-purple-500/20 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Wallet Address</div>
            <div className="text-sm font-bold text-purple-400 font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 