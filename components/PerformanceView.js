import { useState, useEffect } from 'react';

export default function PerformanceView() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCircuitBreakerColor = (state) => {
    switch (state) {
      case 'CLOSED': return 'text-green-400';
      case 'HALF_OPEN': return 'text-yellow-400';
      case 'OPEN': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCircuitBreakerIcon = (state) => {
    switch (state) {
      case 'CLOSED': return '🟢';
      case 'HALF_OPEN': return '🟡';
      case 'OPEN': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Performance Data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
        <div className="text-red-300 font-medium">Error Loading Performance Data</div>
        <div className="text-red-200 text-sm">{error}</div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center text-white">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold mb-2">No Performance Data</h2>
        <p className="text-gray-300">System health data is unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-white">⚡ Performance Monitor</h1>

      {/* Overall Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg ${healthData.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="text-sm text-gray-300">Overall Status</div>
            <div className={`text-lg font-bold ${healthData.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {healthData.status === 'healthy' ? '🟢 Healthy' : '🔴 Degraded'}
            </div>
          </div>
          
          <div className="bg-blue-500/20 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Response Time</div>
            <div className="text-lg font-bold text-blue-400">{healthData.responseTime}</div>
          </div>
          
          <div className="bg-purple-500/20 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Uptime</div>
            <div className="text-lg font-bold text-purple-400">
              {Math.floor(healthData.uptime / 60)}m {Math.floor(healthData.uptime % 60)}s
            </div>
          </div>
          
          <div className="bg-orange-500/20 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Memory Usage</div>
            <div className="text-lg font-bold text-orange-400">
              {Math.round(healthData.memory.heapUsed / 1024 / 1024)}MB
            </div>
          </div>
        </div>
      </div>

      {/* Circuit Breakers */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Circuit Breakers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(healthData.circuitBreakers || {}).map(([name, stats]) => (
            <div key={name} className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white capitalize">{name}</h3>
                <span className={`text-lg ${getCircuitBreakerColor(stats.state)}`}>
                  {getCircuitBreakerIcon(stats.state)}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">State:</span>
                  <span className={`font-medium ${getCircuitBreakerColor(stats.state)}`}>
                    {stats.state}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Failure Rate:</span>
                  <span className="text-white">{(stats.failureRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Success Count:</span>
                  <span className="text-white">{stats.successCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Failure Count:</span>
                  <span className="text-white">{stats.failureCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Polling */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Smart Polling</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Active Wallets</div>
            <div className="text-2xl font-bold text-blue-400">{healthData.smartPolling?.activeWallets || 0}</div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Error Counts</div>
            <div className="text-2xl font-bold text-red-400">
              {Object.keys(healthData.smartPolling?.errorCounts || {}).length}
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Polling Status</div>
            <div className="text-lg font-bold text-green-400">Active</div>
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Cache Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Cache Type</div>
            <div className="text-lg font-bold text-blue-400">{healthData.cache?.type || 'In-Memory'}</div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Total Keys</div>
            <div className="text-lg font-bold text-green-400">{healthData.cache?.totalKeys || 0}</div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Hit Rate</div>
            <div className="text-lg font-bold text-yellow-400">
              {healthData.cache?.hitRate ? `${(healthData.cache.hitRate * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-sm text-gray-300">Cache Status</div>
            <div className="text-lg font-bold text-green-400">Healthy</div>
          </div>
        </div>
      </div>

      {/* Service Health */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Service Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${healthData.services?.flow?.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="text-sm text-gray-300">Flow Blockchain</div>
            <div className={`text-lg font-bold ${healthData.services?.flow?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {healthData.services?.flow?.status === 'healthy' ? '🟢 Healthy' : '🔴 Degraded'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${healthData.services?.websocket?.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="text-sm text-gray-300">WebSocket Server</div>
            <div className={`text-lg font-bold ${healthData.services?.websocket?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
              {healthData.services?.websocket?.status === 'healthy' ? '🟢 Healthy' : '🔴 Degraded'}
            </div>
          </div>
          
          <div className={`p-4 rounded-lg ${healthData.services?.redis?.status === 'healthy' ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
            <div className="text-sm text-gray-300">Redis Cache</div>
            <div className={`text-lg font-bold ${healthData.services?.redis?.status === 'healthy' ? 'text-green-400' : 'text-yellow-400'}`}>
              {healthData.services?.redis?.status === 'healthy' ? '🟢 Healthy' : '🟡 Fallback'}
            </div>
          </div>
        </div>
      </div>

      {/* Price Alerts & Sentiment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Price Alerts</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Alerts:</span>
              <span className="text-white font-bold">{healthData.priceAlerts?.totalAlerts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Active Alerts:</span>
              <span className="text-green-400 font-bold">{healthData.priceAlerts?.activeAlerts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Notifications Sent:</span>
              <span className="text-blue-400 font-bold">{healthData.priceAlerts?.notificationsSent || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Market Sentiment</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Active Moments:</span>
              <span className="text-white font-bold">{healthData.marketSentiment?.activeMoments || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Active Analyses:</span>
              <span className="text-green-400 font-bold">{healthData.marketSentiment?.activeAnalyses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">AI Predictions:</span>
              <span className="text-purple-400 font-bold">{healthData.marketSentiment?.predictionsGenerated || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 