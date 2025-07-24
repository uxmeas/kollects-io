import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

export default function Phase2Dashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Phase 2 Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Navigation />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          ⚡ Performance Monitoring Dashboard
        </h1>

        {/* Overall Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
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
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Circuit Breakers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(healthData.circuitBreakers).map(([name, stats]) => (
              <div key={name} className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white capitalize">{name}</h3>
                  <span className={`text-2xl ${getCircuitBreakerColor(stats.state)}`}>
                    {getCircuitBreakerIcon(stats.state)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">State:</span>
                    <span className={`font-medium ${getCircuitBreakerColor(stats.state)}`}>
                      {stats.state}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Success Rate:</span>
                    <span className="text-green-400 font-medium">
                      {stats.requestCount > 0 ? Math.round(((stats.requestCount - stats.errorCount) / stats.requestCount) * 100) : 0}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg Response:</span>
                    <span className="text-blue-400 font-medium">{stats.averageResponseTime}ms</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-300">Requests:</span>
                    <span className="text-purple-400 font-medium">{stats.requestCount}</span>
                  </div>
                  
                  {stats.state === 'OPEN' && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Retry In:</span>
                      <span className="text-yellow-400 font-medium">
                        {Math.ceil(stats.timeUntilRetry / 1000)}s
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Polling */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Smart Polling</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Active Wallets</div>
              <div className="text-2xl font-bold text-green-400">{healthData.smartPolling.activeWallets}</div>
            </div>
            
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Polling Intervals</div>
              <div className="text-2xl font-bold text-blue-400">{healthData.smartPolling.pollingIntervals.length}</div>
            </div>
            
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Data History</div>
              <div className="text-2xl font-bold text-purple-400">
                {Object.values(healthData.smartPolling.dataHistorySizes).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            
            <div className="bg-orange-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Error Count</div>
              <div className="text-2xl font-bold text-orange-400">
                {Object.values(healthData.smartPolling.errorCounts).reduce((a, b) => a + b, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Service Health */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(healthData.services).map(([name, service]) => (
              <div key={name} className={`p-4 rounded-lg ${service.status === 'healthy' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white capitalize">{name}</h3>
                  <span className={`text-xl ${service.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                    {service.status === 'healthy' ? '🟢' : '🔴'}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Status:</span>
                    <span className={`font-medium ${service.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                      {service.status}
                    </span>
                  </div>
                  
                  {service.responseTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Response:</span>
                      <span className="text-blue-400 font-medium">{service.responseTime}</span>
                    </div>
                  )}
                  
                  {service.connectedClients !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Clients:</span>
                      <span className="text-purple-400 font-medium">{service.connectedClients}</span>
                    </div>
                  )}
                  
                  {service.keys !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Keys:</span>
                      <span className="text-orange-400 font-medium">{service.keys}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cache Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Cache Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Cache Type</div>
              <div className="text-lg font-bold text-blue-400 capitalize">{healthData.cache.type}</div>
            </div>
            
            <div className="bg-green-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Cached Keys</div>
              <div className="text-lg font-bold text-green-400">{healthData.cache.keys}</div>
            </div>
            
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Cache Info</div>
              <div className="text-sm font-medium text-purple-400 truncate">{healthData.cache.info}</div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchHealthData}
            className="px-8 py-3 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
} 