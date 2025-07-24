// Price Alert Service for kollects.io
// Monitors moment prices and sends real-time notifications

import { cacheService } from './redis-cache.js';
import { smartPolling } from './smart-polling.js';

class PriceAlertService {
  constructor() {
    this.alerts = new Map(); // walletAddress -> alerts[]
    this.priceHistory = new Map(); // momentId -> priceHistory[]
    this.activeAlerts = new Set();
    this.alertCallbacks = new Map(); // alertId -> callback
    this.priceThresholds = {
      default: 0.05, // 5% change threshold
      aggressive: 0.02, // 2% for high-value moments
      conservative: 0.10 // 10% for low-value moments
    };
  }

  // Create a new price alert
  createAlert(walletAddress, momentId, options = {}) {
    const alertId = `${walletAddress}-${momentId}-${Date.now()}`;
    
    const alert = {
      id: alertId,
      walletAddress,
      momentId,
      type: options.type || 'price_change', // price_change, price_above, price_below
      threshold: options.threshold || this.priceThresholds.default,
      targetPrice: options.targetPrice,
      currentPrice: options.currentPrice || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
      maxTriggers: options.maxTriggers || 10,
      notificationChannels: options.notificationChannels || ['websocket'],
      message: options.message || `Price alert for moment ${momentId}`
    };

    // Store alert
    if (!this.alerts.has(walletAddress)) {
      this.alerts.set(walletAddress, []);
    }
    this.alerts.get(walletAddress).push(alert);
    this.activeAlerts.add(alertId);

    // Start monitoring if not already active
    this.startMonitoring(walletAddress);

    console.log(`🚨 Created price alert ${alertId} for moment ${momentId}`);
    return alert;
  }

  // Start monitoring a wallet for price changes
  startMonitoring(walletAddress) {
    if (this.activeAlerts.has(`${walletAddress}-monitoring`)) {
      return; // Already monitoring
    }

    this.activeAlerts.add(`${walletAddress}-monitoring`);

    // Use smart polling to check prices
    smartPolling.startPolling(
      walletAddress,
      async () => {
        return await this.checkPrices(walletAddress);
      },
      {
        initialInterval: 30000, // 30 seconds
        volatilityThreshold: 0.02 // 2% for price monitoring
      }
    );

    console.log(`📊 Started price monitoring for wallet ${walletAddress}`);
  }

  // Check prices for a wallet and trigger alerts
  async checkPrices(walletAddress) {
    try {
      // Get current portfolio data
      const { EnhancedFlowAPIService } = await import('./flow-api-service-enhanced.js');
      const flowService = new EnhancedFlowAPIService();
      
      const portfolioData = await flowService.getPortfolioData(walletAddress);
      
      // Simulate price data (in real implementation, this would come from price APIs)
      const priceData = await this.getSimulatedPriceData(walletAddress, portfolioData);
      
      // Check each alert
      const walletAlerts = this.alerts.get(walletAddress) || [];
      const triggeredAlerts = [];

      for (const alert of walletAlerts) {
        if (!alert.isActive) continue;

        const currentPrice = priceData[alert.momentId] || alert.currentPrice;
        const shouldTrigger = this.shouldTriggerAlert(alert, currentPrice);

        if (shouldTrigger) {
          alert.triggerCount++;
          alert.lastTriggered = new Date().toISOString();
          alert.currentPrice = currentPrice;

          // Deactivate if max triggers reached
          if (alert.triggerCount >= alert.maxTriggers) {
            alert.isActive = false;
            this.activeAlerts.delete(alert.id);
          }

          triggeredAlerts.push(alert);
          console.log(`🚨 Price alert triggered: ${alert.id} - Price: $${currentPrice}`);
        }
      }

      // Send notifications for triggered alerts
      if (triggeredAlerts.length > 0) {
        await this.sendNotifications(walletAddress, triggeredAlerts, priceData);
      }

      return {
        walletAddress,
        priceData,
        triggeredAlerts: triggeredAlerts.length,
        activeAlerts: walletAlerts.filter(a => a.isActive).length
      };

    } catch (error) {
      console.error(`❌ Error checking prices for ${walletAddress}:`, error.message);
      throw error;
    }
  }

  // Determine if an alert should be triggered
  shouldTriggerAlert(alert, currentPrice) {
    if (!alert.isActive || alert.triggerCount >= alert.maxTriggers) {
      return false;
    }

    const previousPrice = alert.currentPrice || 0;
    if (previousPrice === 0) {
      alert.currentPrice = currentPrice;
      return false; // First check, just update price
    }

    const priceChange = Math.abs(currentPrice - previousPrice) / previousPrice;

    switch (alert.type) {
      case 'price_change':
        return priceChange >= alert.threshold;
      
      case 'price_above':
        return currentPrice > alert.targetPrice;
      
      case 'price_below':
        return currentPrice < alert.targetPrice;
      
      default:
        return false;
    }
  }

  // Simulate price data (replace with real price API)
  async getSimulatedPriceData(walletAddress, portfolioData) {
    const priceData = {};
    
    // Simulate price movements for moments
    const allMoments = [
      ...(portfolioData.topShotCollection || []),
      ...(portfolioData.allDayCollection || [])
    ];

    for (const moment of allMoments) {
      // Generate realistic price movements
      const basePrice = 50 + Math.random() * 200; // $50-$250 base price
      const volatility = 0.1; // 10% volatility
      const change = (Math.random() - 0.5) * volatility; // -5% to +5%
      
      // Use moment ID as key, fallback to string if needed
      const momentId = moment.id || moment.toString();
      priceData[momentId] = Math.max(1, basePrice * (1 + change));
    }

    return priceData;
  }

  // Send notifications for triggered alerts
  async sendNotifications(walletAddress, alerts, priceData) {
    for (const alert of alerts) {
      const notification = {
        type: 'price_alert',
        alertId: alert.id,
        walletAddress,
        momentId: alert.momentId,
        currentPrice: priceData[alert.momentId],
        message: alert.message,
        timestamp: new Date().toISOString(),
        alert: {
          type: alert.type,
          threshold: alert.threshold,
          triggerCount: alert.triggerCount,
          maxTriggers: alert.maxTriggers
        }
      };

      // Send via WebSocket
      if (alert.notificationChannels.includes('websocket')) {
        await this.sendWebSocketNotification(walletAddress, notification);
      }

      // Store in cache for persistence
      await this.storeNotification(walletAddress, notification);

      // Call custom callback if registered
      const callback = this.alertCallbacks.get(alert.id);
      if (callback) {
        try {
          await callback(notification);
        } catch (error) {
          console.error(`❌ Error in alert callback for ${alert.id}:`, error);
        }
      }
    }
  }

  // Send WebSocket notification
  async sendWebSocketNotification(walletAddress, notification) {
    try {
      // This would integrate with the WebSocket server
      // For now, we'll simulate it
      console.log(`📡 WebSocket notification sent to ${walletAddress}:`, notification.message);
    } catch (error) {
      console.error(`❌ Error sending WebSocket notification:`, error);
    }
  }

  // Store notification in cache
  async storeNotification(walletAddress, notification) {
    const key = `notifications:${walletAddress}`;
    const notifications = await cacheService.get(key) || [];
    
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }
    
    await cacheService.set(key, notifications, 86400); // 24 hours
  }

  // Get alerts for a wallet
  getAlerts(walletAddress) {
    return this.alerts.get(walletAddress) || [];
  }

  // Get active alerts for a wallet
  getActiveAlerts(walletAddress) {
    const alerts = this.getAlerts(walletAddress);
    return alerts.filter(alert => alert.isActive);
  }

  // Update an alert
  updateAlert(alertId, updates) {
    for (const [walletAddress, alerts] of this.alerts) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        Object.assign(alert, updates);
        console.log(`✏️ Updated alert ${alertId}`);
        return alert;
      }
    }
    return null;
  }

  // Delete an alert
  deleteAlert(alertId) {
    for (const [walletAddress, alerts] of this.alerts) {
      const index = alerts.findIndex(a => a.id === alertId);
      if (index !== -1) {
        alerts.splice(index, 1);
        this.activeAlerts.delete(alertId);
        console.log(`🗑️ Deleted alert ${alertId}`);
        return true;
      }
    }
    return false;
  }

  // Register a custom callback for an alert
  registerCallback(alertId, callback) {
    this.alertCallbacks.set(alertId, callback);
  }

  // Get notification history for a wallet
  async getNotificationHistory(walletAddress, limit = 20) {
    const key = `notifications:${walletAddress}`;
    const notifications = await cacheService.get(key) || [];
    return notifications.slice(0, limit);
  }

  // Get stats
  getStats() {
    const totalAlerts = Array.from(this.alerts.values()).flat().length;
    const activeAlerts = Array.from(this.alerts.values()).flat().filter(a => a.isActive).length;
    const monitoredWallets = this.alerts.size;

    return {
      totalAlerts,
      activeAlerts,
      monitoredWallets,
      priceHistorySize: this.priceHistory.size,
      activeCallbacks: this.alertCallbacks.size
    };
  }

  // Stop monitoring a wallet
  stopMonitoring(walletAddress) {
    smartPolling.stopPolling(walletAddress);
    this.activeAlerts.delete(`${walletAddress}-monitoring`);
    
    // Remove all alerts for this wallet
    this.alerts.delete(walletAddress);
    
    console.log(`🛑 Stopped price monitoring for wallet ${walletAddress}`);
  }
}

export const priceAlertService = new PriceAlertService(); 