# LiveToken.co Implementation Guide for kollects.io

## Quick Start: Critical Improvements Implementation

This guide provides step-by-step instructions for implementing the most impactful LiveToken.co architecture improvements in the existing kollects.io codebase.

## Phase 1: Real-Time Foundation (Week 1)

### 1.1 Add Redis Caching Layer

**Step 1: Install Dependencies**
```bash
npm install ioredis socket.io @tanstack/react-query
```

**Step 2: Create Redis Cache Service**
```javascript
// lib/redis-cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class CacheService {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 900; // 15 minutes
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis invalidate error:', error);
      return 0;
    }
  }

  async getOrSet(key, fetchFn, ttl = this.defaultTTL) {
    let data = await this.get(key);
    if (!data) {
      data = await fetchFn();
      if (data) {
        await this.set(key, data, ttl);
      }
    }
    return data;
  }
}

export const cacheService = new CacheService();
```

**Step 3: Update Flow API Service with Caching**
```javascript
// lib/flow-api-service-enhanced.js
import { cacheService } from './redis-cache.js';

class EnhancedFlowAPIService extends FlowAPIService {
  async getTopShotCollectionIds(accountAddress) {
    const cacheKey = `topshot-collection-${accountAddress}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Original blockchain query logic
        const script = CADENCE_SCRIPTS.getTopShotCollectionIds;
        const args = [this.encodeValue(accountAddress)];
        const result = await this.executeScript(script, args);
        return this.parseCollectionIds(result);
      },
      900 // 15 minutes cache
    );
  }

  async getTopShotMomentDetails(accountAddress, momentId) {
    const cacheKey = `topshot-moment-${accountAddress}-${momentId}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const script = CADENCE_SCRIPTS.getTopShotMomentDetails;
        const args = [
          this.encodeValue(accountAddress),
          this.encodeValue(momentId)
        ];
        const result = await this.executeScript(script, args);
        return this.parseMomentData(result);
      },
      1800 // 30 minutes for detailed data
    );
  }
}
```

### 1.2 Implement WebSocket Real-Time Updates

**Step 1: Create WebSocket API Endpoint**
```javascript
// pages/api/websocket.js
import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('Setting up WebSocket server...');
    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe-wallet', async (walletAddress) => {
        console.log(`Client ${socket.id} subscribing to wallet: ${walletAddress}`);
        socket.join(`wallet-${walletAddress}`);
        
        // Send initial data
        try {
          const flowService = new EnhancedFlowAPIService();
          const portfolioData = await flowService.getPortfolioData(walletAddress);
          socket.emit('portfolio-update', portfolioData);
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch initial data' });
        }
      });

      socket.on('unsubscribe-wallet', (walletAddress) => {
        socket.leave(`wallet-${walletAddress}`);
        console.log(`Client ${socket.id} unsubscribed from wallet: ${walletAddress}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Set up periodic updates for active wallets
    setInterval(async () => {
      const rooms = io.sockets.adapter.rooms;
      for (const [roomName, sockets] of rooms) {
        if (roomName.startsWith('wallet-')) {
          const walletAddress = roomName.replace('wallet-', '');
          try {
            const flowService = new EnhancedFlowAPIService();
            const portfolioData = await flowService.getPortfolioData(walletAddress);
            io.to(roomName).emit('portfolio-update', portfolioData);
          } catch (error) {
            console.error(`Error updating wallet ${walletAddress}:`, error);
          }
        }
      }
    }, 30000); // Update every 30 seconds
  }
  
  res.end();
};

export default ioHandler;
```

**Step 2: Create React Hook for WebSocket**
```javascript
// hooks/useWebSocket.js
import { useState, useEffect, useRef } from 'react';

export function useWebSocket(walletAddress) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!walletAddress) return;

    // Connect to WebSocket
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('subscribe-wallet', walletAddress);
    });

    socket.on('portfolio-update', (portfolioData) => {
      setData(portfolioData);
      setError(null);
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socket) {
        socket.emit('unsubscribe-wallet', walletAddress);
        socket.disconnect();
      }
    };
  }, [walletAddress]);

  return { data, isConnected, error };
}
```

### 1.3 Update Dashboard with Real-Time Features

**Step 1: Enhanced Dashboard Component**
```javascript
// pages/enhanced-dashboard-realtime.js
import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';

export default function EnhancedDashboardRealtime({ walletAddress }) {
  const { data: realtimeData, isConnected, error: wsError } = useWebSocket(walletAddress);
  const [lastUpdate, setLastUpdate] = useState(null);

  // TanStack Query for additional data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?wallet=${walletAddress}`);
      return response.json();
    },
    refetchInterval: 60000, // 1 minute
    enabled: !!walletAddress
  });

  useEffect(() => {
    if (realtimeData) {
      setLastUpdate(new Date());
    }
  }, [realtimeData]);

  if (!walletAddress) {
    return <div className="text-center text-gray-500">Please enter a wallet address</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Last Update Indicator */}
      {lastUpdate && (
        <div className="fixed top-4 left-4 z-50">
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
            Last Update: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Value Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Portfolio Value</h3>
            <div className="text-3xl font-bold text-kollects-gold">
              ${realtimeData?.portfolio?.totalValue?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-300 mt-2">
              {realtimeData?.portfolio?.totalMoments || 0} moments
            </div>
          </div>

          {/* NBA Top Shot Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">NBA Top Shot</h3>
            <div className="text-3xl font-bold text-blue-400">
              {realtimeData?.topShotCollection?.length || 0}
            </div>
            <div className="text-sm text-gray-300 mt-2">moments</div>
          </div>

          {/* NFL All Day Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">NFL All Day</h3>
            <div className="text-3xl font-bold text-orange-400">
              {realtimeData?.allDayCollection?.length || 0}
            </div>
            <div className="text-sm text-gray-300 mt-2">moments</div>
          </div>
        </div>

        {/* Real-Time Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Value Trend</h3>
            <PortfolioValueChart data={realtimeData} />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Rarity Distribution</h3>
            <RarityDistributionChart data={realtimeData} />
          </div>
        </div>

        {/* Error Display */}
        {wsError && (
          <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="text-red-300 font-medium">Connection Error</div>
            <div className="text-red-200 text-sm">{wsError}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Chart Components
function PortfolioValueChart({ data }) {
  // Implementation with Recharts or D3.js
  return (
    <div className="h-64 flex items-center justify-center text-gray-400">
      Real-time portfolio value chart
    </div>
  );
}

function RarityDistributionChart({ data }) {
  // Implementation with Recharts or D3.js
  return (
    <div className="h-64 flex items-center justify-center text-gray-400">
      Rarity distribution chart
    </div>
  );
}
```

## Phase 2: Performance Optimization (Week 2)

### 2.1 Implement Smart Polling

```javascript
// lib/smart-polling.js
class SmartPollingService {
  constructor() {
    this.pollingIntervals = new Map();
    this.activeWallets = new Set();
  }

  startPolling(walletAddress, callback) {
    if (this.activeWallets.has(walletAddress)) {
      return; // Already polling
    }

    this.activeWallets.add(walletAddress);
    
    // Start with 30-second intervals
    let interval = 30000;
    let consecutiveErrors = 0;
    
    const poll = async () => {
      try {
        const data = await callback();
        
        // Reset error count on success
        consecutiveErrors = 0;
        
        // Adjust interval based on data volatility
        if (this.isDataVolatile(data)) {
          interval = Math.max(interval / 2, 5000); // Minimum 5 seconds
        } else {
          interval = Math.min(interval * 1.5, 300000); // Maximum 5 minutes
        }
        
        // Reschedule with new interval
        this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
        
      } catch (error) {
        consecutiveErrors++;
        
        // Increase interval on errors
        interval = Math.min(interval * 2, 300000);
        
        // Stop polling after 5 consecutive errors
        if (consecutiveErrors >= 5) {
          this.stopPolling(walletAddress);
          return;
        }
        
        this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
      }
    };

    // Start initial poll
    this.pollingIntervals.set(walletAddress, setTimeout(poll, interval));
  }

  stopPolling(walletAddress) {
    const intervalId = this.pollingIntervals.get(walletAddress);
    if (intervalId) {
      clearTimeout(intervalId);
      this.pollingIntervals.delete(walletAddress);
    }
    this.activeWallets.delete(walletAddress);
  }

  isDataVolatile(data) {
    // Implement logic to detect data volatility
    // For example, check if portfolio value changed significantly
    return false; // Placeholder
  }
}

export const smartPolling = new SmartPollingService();
```

### 2.2 Add Circuit Breaker Pattern

```javascript
// lib/circuit-breaker.js
class CircuitBreaker {
  constructor(failureThreshold = 5, timeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage in Flow API Service
const flowCircuitBreaker = new CircuitBreaker();

class ResilientFlowAPIService extends EnhancedFlowAPIService {
  async executeScript(script, args = []) {
    return await flowCircuitBreaker.execute(async () => {
      return await super.executeScript(script, args);
    });
  }
}
```

## Phase 3: Advanced Features (Week 3-4)

### 3.1 Price Alert System

```javascript
// lib/price-alerts.js
class PriceAlertService {
  constructor() {
    this.alerts = new Map();
    this.priceHistory = new Map();
  }

  addAlert(walletAddress, momentId, targetPrice, condition = 'above') {
    const alertKey = `${walletAddress}-${momentId}`;
    this.alerts.set(alertKey, {
      walletAddress,
      momentId,
      targetPrice,
      condition,
      createdAt: new Date(),
      triggered: false
    });
  }

  async checkAlerts(momentData) {
    for (const [alertKey, alert] of this.alerts) {
      if (alert.triggered) continue;

      const currentPrice = momentData.currentPrice;
      let shouldTrigger = false;

      if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
        shouldTrigger = true;
      } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        await this.triggerAlert(alert);
        alert.triggered = true;
      }
    }
  }

  async triggerAlert(alert) {
    // Send notification via WebSocket
    const io = require('socket.io')();
    io.to(`wallet-${alert.walletAddress}`).emit('price-alert', {
      momentId: alert.momentId,
      targetPrice: alert.targetPrice,
      currentPrice: alert.currentPrice,
      condition: alert.condition
    });
  }
}

export const priceAlertService = new PriceAlertService();
```

### 3.2 Market Sentiment Analysis

```javascript
// lib/market-sentiment.js
class MarketSentimentService {
  async analyzeSentiment(momentId) {
    // Implement sentiment analysis based on:
    // - Social media mentions
    // - Trading volume
    // - Price movement patterns
    // - Community engagement
    
    const sentimentData = {
      score: 0.75, // -1 to 1
      confidence: 0.85,
      factors: {
        socialMentions: 150,
        volumeChange: 0.25,
        priceVolatility: 0.15
      }
    };

    return sentimentData;
  }

  async getMarketTrends() {
    // Analyze overall market trends
    return {
      bullish: 0.65,
      bearish: 0.20,
      neutral: 0.15,
      topPerformers: [],
      trendingPlayers: []
    };
  }
}

export const marketSentiment = new MarketSentimentService();
```

## Deployment Configuration

### Environment Variables
```bash
# .env.local
REDIS_URL=redis://localhost:6379
QUICKNODE_FLOW_ENDPOINT=https://your-quicknode-endpoint
PUBLIC_FLOW_ENDPOINT=https://rest-mainnet.onflow.org/v1/scripts
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3000
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

## Performance Monitoring

### Add Monitoring Endpoints
```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: await checkRedisHealth(),
      flow: await checkFlowHealth(),
      websocket: await checkWebSocketHealth()
    }
  };

  res.status(200).json(health);
}

async function checkRedisHealth() {
  try {
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    return { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

This implementation guide provides the foundation for transforming kollects.io into a real-time platform that can compete with LiveToken.co. The phased approach ensures that each improvement delivers immediate value while building toward the comprehensive architecture needed for success in the NBA Top Shot analytics space. 