import { useState, useEffect } from 'react';

export default function AlertsView({ walletAddress }) {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState(null);
  const [newAlert, setNewAlert] = useState({
    momentId: '',
    type: 'price_above',
    threshold: 100,
    message: '',
    maxTriggers: 10
  });

  useEffect(() => {
    if (walletAddress) {
      fetchAlerts();
      fetchNotifications();
    }
  }, [walletAddress]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/alerts?walletAddress=${walletAddress}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
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
          message: newAlert.message,
          maxTriggers: parseInt(newAlert.maxTriggers)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowCreateForm(false);
        setNewAlert({
          momentId: '',
          type: 'price_above',
          threshold: 100,
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

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'price_change': return 'Price Change';
      case 'price_above': return 'Price Above';
      case 'price_below': return 'Price Below';
      default: return type;
    }
  };

  const getAlertStatusColor = (alert) => {
    if (alert.triggerCount >= alert.maxTriggers) return 'text-red-400';
    if (alert.isPaused) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">🔔 Price Alerts</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-2 bg-kollects-gold text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          🚨 Create Alert
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-300 font-medium">Error</div>
          <div className="text-red-200 text-sm">{error}</div>
        </div>
      )}

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Create Price Alert</h2>
          <form onSubmit={createAlert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Moment ID</label>
                <input
                  type="text"
                  value={newAlert.momentId}
                  onChange={(e) => setNewAlert({...newAlert, momentId: e.target.value})}
                  placeholder="Enter moment ID (e.g., 123456)"
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
                  <option value="price_above">Price Above</option>
                  <option value="price_below">Price Below</option>
                  <option value="price_change">Price Change</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Threshold ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({...newAlert, threshold: e.target.value})}
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
              <input
                type="text"
                value={newAlert.message}
                onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                placeholder="Custom alert message"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-kollects-gold text-blue-900 font-bold rounded-lg hover:bg-yellow-400 transition-colors"
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

      {/* Active Alerts */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Active Alerts ({alerts.length})</h2>
        {alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-400">#{alert.momentId}</div>
                      <div className="text-white font-medium">{getAlertTypeLabel(alert.type)}</div>
                      <div className="text-kollects-gold font-bold">${alert.threshold}</div>
                      <div className={`text-sm ${getAlertStatusColor(alert)}`}>
                        {alert.triggerCount}/{alert.maxTriggers} triggers
                      </div>
                    </div>
                    {alert.message && (
                      <div className="text-sm text-gray-400 mt-1">{alert.message}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">🔔</div>
            <p>No active alerts</p>
            <p className="text-sm">Create your first price alert to get started</p>
          </div>
        )}
      </div>

      {/* Notification History */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-2xl font-semibold text-white mb-4">Notification History ({notifications.length})</h2>
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.slice(0, 10).map((notification, index) => (
              <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-400">#{notification.momentId}</div>
                      <div className="text-white font-medium">{notification.type}</div>
                      <div className="text-sm text-gray-300">
                        ${notification.oldPrice} → ${notification.newPrice}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">📋</div>
            <p>No notifications yet</p>
            <p className="text-sm">Alerts will appear here when triggered</p>
          </div>
        )}
      </div>
    </div>
  );
} 