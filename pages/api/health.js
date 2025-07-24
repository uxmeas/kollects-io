// Health check API endpoint
// Monitors system status including Redis, Flow blockchain, and WebSocket connections

import { cacheService } from '../../lib/redis-cache.js';
import { EnhancedFlowAPIService } from '../../lib/flow-api-service-enhanced.js';
import { circuitBreakerManager } from '../../lib/circuit-breaker.js';
import { smartPolling } from '../../lib/smart-polling.js';
import { priceAlertService } from '../../lib/price-alert-service.js';
import { marketSentimentService } from '../../lib/market-sentiment-service.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Check Redis health
    const redisHealth = await checkRedisHealth();
    
    // Check Flow blockchain health
    const flowHealth = await checkFlowHealth();
    
    // Check WebSocket health
    const websocketHealth = await checkWebSocketHealth(req);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    const overallStatus = 
      redisHealth.status === 'healthy' && 
      flowHealth.status === 'healthy' && 
      websocketHealth.status === 'healthy' 
        ? 'healthy' 
        : 'degraded';
    
    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        redis: redisHealth,
        flow: flowHealth,
        websocket: websocketHealth
      },
      circuitBreakers: circuitBreakerManager.getAllStats(),
      smartPolling: smartPolling.getStats(),
      priceAlerts: priceAlertService.getStats(),
      marketSentiment: marketSentimentService.getStats(),
      cache: await cacheService.getStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        redis: { status: 'unknown', error: 'Health check failed' },
        flow: { status: 'unknown', error: 'Health check failed' },
        websocket: { status: 'unknown', error: 'Health check failed' }
      }
    });
  }
}

async function checkRedisHealth() {
  const startTime = Date.now();
  
  try {
    const stats = await cacheService.getStats();
    const responseTime = Date.now() - startTime;
    
    return {
      status: stats.type === 'error' ? 'unhealthy' : 'healthy',
      responseTime: `${responseTime}ms`,
      type: stats.type,
      keys: stats.keys,
      info: stats.info
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 'timeout',
      error: error.message
    };
  }
}

async function checkFlowHealth() {
  const startTime = Date.now();
  
  try {
    const flowService = new EnhancedFlowAPIService();
    
    // Test with a simple connection check
    const testScript = `
      access(all) fun main(): String {
          return "Flow connection test successful!"
      }`;
    
    const result = await flowService.executeScript(testScript);
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      endpoint: 'QuickNode Flow',
      testResult: result
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: 'timeout',
      error: error.message,
      endpoint: 'QuickNode Flow'
    };
  }
}

async function checkWebSocketHealth(req) {
  try {
    // Check if WebSocket server is initialized
    if (req.socket.server.io) {
      const io = req.socket.server.io;
      const stats = {
        connectedClients: io.engine.clientsCount,
        activeRooms: io.sockets.adapter.rooms.size,
        transports: io.engine.clientsCount > 0 ? 'websocket' : 'none'
      };
      
      return {
        status: 'healthy',
        connectedClients: stats.connectedClients,
        activeRooms: stats.activeRooms,
        transports: stats.transports
      };
    } else {
      return {
        status: 'initializing',
        connectedClients: 0,
        activeRooms: 0,
        transports: 'none'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Additional health check endpoints
export async function getDetailedHealth() {
  const health = {
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    cache: await cacheService.getStats(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured'
    }
  };
  
  return health;
} 