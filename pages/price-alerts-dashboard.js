import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';
import Navigation from '../components/Navigation';

export default function PriceAlertsDashboard() {
  const [walletAddress, setWalletAddress] = useState('0x40f69697c82b7077');
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    momentId: '',
    type: 'price_change',
    threshold: 0.05,
    targetPrice: '',
    message: '',
    maxTriggers: 10
  });

  // WebSocket connection for real-time updates
  const { data: wsData, isConnected: wsConnected } = useWebSocket(walletAddress);

  useEffect(() => {
    if (walletAddress) {
      fetchAlerts();
      fetchNotifications();
    }
  }, [walletAddress]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?walletAddress=${walletAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlerts(data.alerts || []);
        setActiveAlerts(data.activeAlerts || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/alerts?walletAddress=${walletAddress}&history=true`);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          momentId: newAlert.momentId,
          type: newAlert.type,
          threshold: parseFloat(newAlert.threshold),
          targetPrice: newAlert.targetPrice ? parseFloat(newAlert.targetPrice) : null,
          message: newAlert.message,
          maxTriggers: parseInt(newAlert.maxTriggers)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowCreateForm(false);
        setNewAlert({
          momentId: '',
          type: 'price_change',
          threshold: 0.05,
          targetPrice: '',
          message: '',
          maxTriggers: 10
        });
        fetchAlerts();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      const response = await fetch(`/api/alerts?alertId=${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAlerts();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAlert = async (alertId, updates) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          ...updates
        }),
      });

      if (response.ok) {
        fetchAlerts();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'price_change': return 'Price Change';
      case 'price_above': return 'Price Above';
      case 'price_below': return 'Price Below';
      default: return type;
    }
  };

  const getAlertStatusColor = (alert) => {
    if (!alert.isActive) return 'text-gray-400';
    if (alert.triggerCount > 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Price Alerts...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <Navigation />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🔔 Price Alerts Dashboard
        </h1>

        {/* Wallet Input */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Wallet Configuration</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter Flow wallet address"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors"
            >
              🚨 Create Alert
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <div className="text-red-300 font-medium">Error</div>
            <div className="text-red-200 text-sm">{error}</div>
          </div>
        )}

        {/* Create Alert Form */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Create Price Alert</h2>
            <form onSubmit={createAlert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Moment ID</label>
                  <input
                    type="text"
                    value={newAlert.momentId}
                    onChange={(e) => setNewAlert({...newAlert, momentId: e.target.value})}
                    placeholder="Enter moment ID"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Alert Type</label>
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-kollects-gold"
                  >
                    <option value="price_change">Price Change</option>
                    <option value="price_above">Price Above</option>
                    <option value="price_below">Price Below</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Threshold (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
                    placeholder="0.05"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                    placeholder="100.00"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Triggers</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newAlert.maxTriggers}
                    onChange={(e) => setNewAlert({...newAlert, maxTriggers: e.target.value})}
                    placeholder="10"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <input
                    type="text"
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                    placeholder="Custom alert message"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-kollects-gold text-court-black font-bold rounded-lg hover:bg-energy-orange transition-colors"
                >
                  🚨 Create Alert
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alerts Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Alerts */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Active Alerts</h2>
            <div className="text-3xl font-bold text-green-400 mb-2">{activeAlerts.length}</div>
            <div className="text-sm text-gray-300">Monitoring for price changes</div>
            
            {activeAlerts.length > 0 && (
              <div className="mt-4 space-y-2">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="bg-white/5 p-3 rounded-lg">
                    <div className="text-sm text-white font-medium">Moment {alert.momentId}</div>
                    <div className="text-xs text-gray-300">{getAlertTypeLabel(alert.type)}</div>
                  </div>
                ))}
                {activeAlerts.length > 3 && (
                  <div className="text-xs text-gray-400">+{activeAlerts.length - 3} more</div>
                )}
              </div>
            )}
          </div>

          {/* Total Alerts */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Total Alerts</h2>
            <div className="text-3xl font-bold text-blue-400 mb-2">{alerts.length}</div>
            <div className="text-sm text-gray-300">All time alerts created</div>
            
            {alerts.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Active:</span>
                  <span className="text-green-400">{activeAlerts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Inactive:</span>
                  <span className="text-gray-400">{alerts.length - activeAlerts.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Recent Notifications</h2>
            <div className="text-3xl font-bold text-purple-400 mb-2">{notifications.length}</div>
            <div className="text-sm text-gray-300">Last 24 hours</div>
            
            {notifications.length > 0 && (
              <div className="mt-4 space-y-2">
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={index} className="bg-white/5 p-3 rounded-lg">
                    <div className="text-sm text-white font-medium">{notification.message}</div>
                    <div className="text-xs text-gray-300">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {notifications.length > 3 && (
                  <div className="text-xs text-gray-400">+{notifications.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">All Alerts</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-6xl mb-4">🚨</div>
              <div className="text-xl font-medium mb-2">No alerts created yet</div>
              <div className="text-sm">Create your first price alert to start monitoring</div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-lg ${getAlertStatusColor(alert)}`}>
                          {alert.isActive ? '🟢' : '🔴'}
                        </span>
                        <span className="text-white font-medium">Moment {alert.momentId}</span>
                        <span className="text-sm text-gray-300">({getAlertTypeLabel(alert.type)})</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-300">Threshold:</span>
                          <span className="text-white ml-1">{(alert.threshold * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-300">Triggers:</span>
                          <span className="text-white ml-1">{alert.triggerCount}/{alert.maxTriggers}</span>
                        </div>
                        <div>
                          <span className="text-gray-300">Created:</span>
                          <span className="text-white ml-1">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {alert.lastTriggered && (
                          <div>
                            <span className="text-gray-300">Last Trigger:</span>
                            <span className="text-white ml-1">
                              {new Date(alert.lastTriggered).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {alert.message && (
                        <div className="text-sm text-gray-300 mt-2">{alert.message}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {alert.isActive ? (
                        <button
                          onClick={() => updateAlert(alert.id, { isActive: false })}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => updateAlert(alert.id, { isActive: true })}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WebSocket Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mt-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Real-Time Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${wsConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className="text-sm text-gray-300">WebSocket Connection</div>
              <div className={`text-lg font-bold ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
            
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Price Monitoring</div>
              <div className="text-lg font-bold text-blue-400">
                {activeAlerts.length > 0 ? '🟢 Active' : '⚪ Inactive'}
              </div>
            </div>
            
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <div className="text-sm text-gray-300">Last Update</div>
              <div className="text-lg font-bold text-purple-400">
                {wsData?.portfolio?.lastUpdated ? 
                  new Date(wsData.portfolio.lastUpdated).toLocaleTimeString() : 
                  'Never'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 