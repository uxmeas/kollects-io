// Smart Polling Service for kollects.io
// Dynamically adjusts refresh rates based on data volatility and error patterns

class SmartPollingService {
  constructor() {
    this.pollingIntervals = new Map();
    this.activeWallets = new Set();
    this.errorCounts = new Map();
    this.dataHistory = new Map();
    this.volatilityThreshold = 0.05; // 5% change threshold
  }

  startPolling(walletAddress, callback, options = {}) {
    if (this.activeWallets.has(walletAddress)) {
      return; // Already polling
    }

    this.activeWallets.add(walletAddress);
    this.errorCounts.set(walletAddress, 0);
    this.dataHistory.set(walletAddress, []);
    
    // Start with 30-second intervals
    let interval = options.initialInterval || 30000;
    let consecutiveErrors = 0;
    let lastData = null;
    
    const poll = async () => {
      try {
        const startTime = Date.now();
        const data = await callback();
        const responseTime = Date.now() - startTime;
        
        // Reset error count on success
        consecutiveErrors = 0;
        this.errorCounts.set(walletAddress, 0);
        
        // Check data volatility
        const isVolatile = this.isDataVolatile(walletAddress, data);
        const isHighTraffic = this.isHighTrafficTime();
        
        // Adjust interval based on conditions
        if (isVolatile || isHighTraffic) {
          interval = Math.max(interval * 0.7, 5000); // Increase frequency, minimum 5 seconds
        } else if (responseTime > 2000) {
          interval = Math.min(interval * 1.2, 120000); // Slow down if slow responses, max 2 minutes
        } else {
          interval = Math.min(interval * 1.1, 60000); // Gradual increase, max 1 minute
        }
        
        // Store data history for volatility analysis
        this.updateDataHistory(walletAddress, data);
        
        // Reschedule with new interval
        this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
        
        console.log(`🔄 Polled ${walletAddress} in ${responseTime}ms, next poll in ${interval/1000}s`);
        
      } catch (error) {
        consecutiveErrors++;
        this.errorCounts.set(walletAddress, consecutiveErrors);
        
        console.error(`❌ Polling error for ${walletAddress}:`, error.message);
        
        // Increase interval on errors (exponential backoff)
        interval = Math.min(interval * Math.pow(1.5, consecutiveErrors), 300000); // Max 5 minutes
        
        // Stop polling after 5 consecutive errors
        if (consecutiveErrors >= 5) {
          console.error(`🛑 Stopping polling for ${walletAddress} after ${consecutiveErrors} errors`);
          this.stopPolling(walletAddress);
          return;
        }
        
        this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
      }
    };

    // Start initial poll
    this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
    console.log(`🚀 Started smart polling for ${walletAddress} with ${interval/1000}s interval`);
  }

  stopPolling(walletAddress) {
    const intervalId = this.pollingIntervals.get(walletAddress);
    if (intervalId) {
      clearTimeout(intervalId);
      this.pollingIntervals.delete(walletAddress);
    }
    this.activeWallets.delete(walletAddress);
    this.errorCounts.delete(walletAddress);
    this.dataHistory.delete(walletAddress);
    console.log(`🛑 Stopped polling for ${walletAddress}`);
  }

  isDataVolatile(walletAddress, currentData) {
    const history = this.dataHistory.get(walletAddress) || [];
    if (history.length < 2) return false;
    
    const lastData = history[history.length - 1];
    
    // Check portfolio value changes
    const currentValue = currentData?.portfolio?.totalValue || 0;
    const lastValue = lastData?.portfolio?.totalValue || 0;
    
    if (lastValue === 0) return false;
    
    const changePercent = Math.abs(currentValue - lastValue) / lastValue;
    return changePercent > this.volatilityThreshold;
  }

  isHighTrafficTime() {
    const now = new Date();
    const hour = now.getHours();
    
    // High traffic times: 9-11 AM and 6-8 PM (market hours)
    return (hour >= 9 && hour <= 11) || (hour >= 18 && hour <= 20);
  }

  updateDataHistory(walletAddress, data) {
    const history = this.dataHistory.get(walletAddress) || [];
    history.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 10 entries
    if (history.length > 10) {
      history.shift();
    }
    
    this.dataHistory.set(walletAddress, history);
  }

  getStats() {
    return {
      activeWallets: this.activeWallets.size,
      pollingIntervals: Array.from(this.pollingIntervals.keys()),
      errorCounts: Object.fromEntries(this.errorCounts),
      dataHistorySizes: Object.fromEntries(
        Array.from(this.dataHistory.entries()).map(([wallet, history]) => [wallet, history.length])
      )
    };
  }

  setVolatilityThreshold(threshold) {
    this.volatilityThreshold = threshold;
  }

  // Emergency stop all polling
  stopAllPolling() {
    for (const walletAddress of this.activeWallets) {
      this.stopPolling(walletAddress);
    }
  }
}

export const smartPolling = new SmartPollingService(); 