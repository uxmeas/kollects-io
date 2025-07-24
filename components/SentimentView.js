import { useState, useEffect } from 'react';

export default function SentimentView({ walletAddress }) {
  const [marketOverview, setMarketOverview] = useState(null);
  const [newMomentId, setNewMomentId] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarketOverview();
    const interval = setInterval(fetchMarketOverview, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketOverview = async () => {
    try {
      const response = await fetch('/api/sentiment/overview');
      const data = await response.json();
      
      if (response.ok) {
        setMarketOverview(data);
      }
    } catch (err) {
      console.error('Error fetching market overview:', err);
    }
  };

  const startAnalysis = async (momentId) => {
    if (!momentId.trim()) {
      alert('Please enter a moment ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sentiment/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ momentId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewMomentId('');
        fetchMarketOverview();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopAnalysis = async (momentId) => {
    try {
      const response = await fetch('/api/sentiment/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ momentId }),
      });

      if (response.ok) {
        fetchMarketOverview();
      }
    } catch (err) {
      console.error('Error stopping analysis:', err);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      case 'neutral': return '➡️';
      default: return '❓';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">🧠 Market Sentiment</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={newMomentId}
            onChange={(e) => setNewMomentId(e.target.value)}
            placeholder="Enter moment ID to analyze"
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
          />
          <button
            onClick={() => startAnalysis(newMomentId)}
            disabled={loading || !newMomentId}
            className="px-6 py-2 bg-kollects-gold text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : '🚀 Start Analysis'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-300 font-medium">Error</div>
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}

      {/* Market Overview */}
      {marketOverview && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Total Moments</div>
              <div className="text-2xl font-bold text-blue-400">{marketOverview.totalMoments}</div>
            </div>
            
            <div className="bg-green-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Bullish Moments</div>
              <div className="text-2xl font-bold text-green-400">{marketOverview.bullishMoments}</div>
            </div>
            
            <div className="bg-red-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Bearish Moments</div>
              <div className="text-2xl font-bold text-red-400">{marketOverview.bearishMoments}</div>
            </div>
            
            <div className="bg-gray-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Neutral Moments</div>
              <div className="text-2xl font-bold text-gray-400">{marketOverview.neutralMoments}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Average Sentiment</div>
              <div className={`text-2xl font-bold ${getSentimentColor(marketOverview.marketSentiment)}`}>
                {marketOverview.averageSentiment}
              </div>
              <div className="text-sm text-gray-400 capitalize">{marketOverview.marketSentiment}</div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Market Sentiment</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSentimentIcon(marketOverview.marketSentiment)}</span>
                <span className={`text-lg font-bold capitalize ${getSentimentColor(marketOverview.marketSentiment)}`}>
                  {marketOverview.marketSentiment}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Analyses */}
      {marketOverview && marketOverview.analyses && marketOverview.analyses.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Active Sentiment Analyses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketOverview.analyses.map((analysis) => (
              <div key={analysis.momentId} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Moment #{analysis.momentId}</h3>
                  <button
                    onClick={() => stopAnalysis(analysis.momentId)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Stop
                  </button>
                </div>
                
                {analysis.latestSentiment && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Sentiment:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getSentimentIcon(analysis.latestSentiment.sentiment)}</span>
                        <span className={`font-medium capitalize ${getSentimentColor(analysis.latestSentiment.sentiment)}`}>
                          {analysis.latestSentiment.sentiment}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Score:</span>
                      <span className="text-white font-medium">{analysis.latestSentiment.score}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Confidence:</span>
                      <span className={`font-medium ${getConfidenceColor(analysis.latestSentiment.confidence)}`}>
                        {Math.round(analysis.latestSentiment.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!marketOverview && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-2xl font-bold mb-2">No Sentiment Data</h2>
          <p>Start analyzing moments to see market sentiment</p>
        </div>
      )}
    </div>
  );
} 