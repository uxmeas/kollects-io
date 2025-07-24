import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

export default function MarketSentimentDashboard() {
  const [marketOverview, setMarketOverview] = useState(null);
  const [activeAnalyses, setActiveAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [momentAnalysis, setMomentAnalysis] = useState(null);
  const [newMomentId, setNewMomentId] = useState('');

  useEffect(() => {
    fetchMarketOverview();
    const interval = setInterval(fetchMarketOverview, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMarketOverview = async () => {
    try {
      const response = await fetch('/api/sentiment?overview=true');
      const data = await response.json();
      setMarketOverview(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async (momentId) => {
    try {
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          momentId,
          options: {
            interval: 300000, // 5 minutes
            sources: ['twitter', 'reddit', 'discord']
          }
        }),
      });

      if (response.ok) {
        setNewMomentId('');
        fetchMarketOverview();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const stopAnalysis = async (momentId) => {
    try {
      const response = await fetch(`/api/sentiment?momentId=${momentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMarketOverview();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMomentAnalysis = async (momentId) => {
    try {
      const response = await fetch(`/api/sentiment?momentId=${momentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMomentAnalysis(data.analysis);
        setSelectedMoment(momentId);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'bullish': return '📈';
      case 'bearish': return '📉';
      default: return '➡️';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.7) return 'text-green-400';
    if (confidence >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Market Sentiment...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Navigation />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🧠 Market Sentiment Dashboard
        </h1>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="text-red-300 font-medium">Error</div>
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        {/* Start New Analysis */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Start Sentiment Analysis</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newMomentId}
              onChange={(e) => setNewMomentId(e.target.value)}
              placeholder="Enter moment ID to analyze"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
            />
            <button
              onClick={() => startAnalysis(newMomentId)}
              disabled={!newMomentId}
              className="px-6 py-2 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 Start Analysis
            </button>
          </div>
        </div>

        {/* Market Overview */}
        {marketOverview && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
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
        {marketOverview && marketOverview.analyses.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Active Sentiment Analyses</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marketOverview.analyses.map((analysis) => (
                <div key={analysis.momentId} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">Moment {analysis.momentId}</h3>
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
                  
                  {analysis.trendPrediction && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Trend:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSentimentIcon(analysis.trendPrediction.trendSignal)}</span>
                          <span className={`font-medium capitalize ${getSentimentColor(analysis.trendPrediction.trendSignal)}`}>
                            {analysis.trendPrediction.trendSignal}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-xs text-gray-400 mb-1">Recommendation:</div>
                        <div className="text-sm text-white">{analysis.trendPrediction.recommendation}</div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => fetchMomentAnalysis(analysis.momentId)}
                    className="w-full mt-4 px-4 py-2 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Moment Analysis */}
        {selectedMoment && momentAnalysis && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Detailed Analysis: Moment {selectedMoment}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sentiment Analysis */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Sentiment Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Overall Sentiment:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSentimentIcon(momentAnalysis.sentiment.sentiment)}</span>
                      <span className={`font-medium capitalize ${getSentimentColor(momentAnalysis.sentiment.sentiment)}`}>
                        {momentAnalysis.sentiment.sentiment}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Sentiment Score:</span>
                    <span className="text-white font-medium">{momentAnalysis.sentiment.score}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Confidence:</span>
                    <span className={`font-medium ${getConfidenceColor(momentAnalysis.sentiment.confidence)}`}>
                      {Math.round(momentAnalysis.sentiment.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-300 mb-2">Sentiment Breakdown:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-400">Positive: {momentAnalysis.sentiment.breakdown.positive}%</span>
                        <span className="text-red-400">Negative: {momentAnalysis.sentiment.breakdown.negative}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Neutral: {momentAnalysis.sentiment.breakdown.neutral}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volume Analysis */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Volume Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Current Volume:</span>
                    <span className="text-white font-medium">{momentAnalysis.volume.currentVolume.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Average Volume:</span>
                    <span className="text-white font-medium">{momentAnalysis.volume.averageVolume.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Volume Change:</span>
                    <span className={`font-medium ${momentAnalysis.volume.volumeChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {momentAnalysis.volume.volumeChange > 0 ? '+' : ''}{momentAnalysis.volume.volumeChange}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Volume Signal:</span>
                    <span className="text-white font-medium capitalize">{momentAnalysis.volume.volumeSignal}</span>
                  </div>
                </div>
              </div>

              {/* Trend Prediction */}
              <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Trend Prediction</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Trend Signal:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSentimentIcon(momentAnalysis.trend.trendSignal)}</span>
                      <span className={`font-medium capitalize ${getSentimentColor(momentAnalysis.trend.trendSignal)}`}>
                        {momentAnalysis.trend.trendSignal}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Price Direction:</span>
                    <span className={`font-medium ${momentAnalysis.trend.priceDirection > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {momentAnalysis.trend.priceDirection > 0 ? '+' : ''}{momentAnalysis.trend.priceDirection}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Confidence:</span>
                    <span className={`font-medium ${getConfidenceColor(momentAnalysis.trend.confidence)}`}>
                      {Math.round(momentAnalysis.trend.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-300 mb-2">Recommendation:</div>
                    <div className="text-sm text-white font-medium">{momentAnalysis.trend.recommendation}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Sources */}
            {momentAnalysis.sentiment.sources && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Social Media Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(momentAnalysis.sentiment.sources).map(([source, data]) => {
                    if (source === 'overall' || !data.sentiment) return null;
                    return (
                      <div key={source} className="bg-white/5 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white capitalize">{source}</span>
                          <span className={`text-sm ${getSentimentColor(data.sentiment > 0 ? 'bullish' : data.sentiment < 0 ? 'bearish' : 'neutral')}`}>
                            {Math.round(data.sentiment * 100)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {data.total} mentions • {data.trending ? '🔥 Trending' : 'Normal'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Active Analyses */}
        {marketOverview && marketOverview.analyses.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-center text-gray-400 py-8">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-xl font-medium mb-2">No active sentiment analyses</div>
              <div className="text-sm">Start analyzing moments to see sentiment data</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 