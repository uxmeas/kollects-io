// Circuit Breaker Pattern for kollects.io
// Prevents cascade failures and provides graceful degradation

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
    this.minimumRequestCount = options.minimumRequestCount || 3;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.requestCount = 0;
    this.errorCount = 0;
    
    // Performance metrics
    this.responseTimes = [];
    this.maxResponseTimeHistory = 10;
  }

  async execute(fn, fallbackFn = null) {
    this.requestCount++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
      } else {
        console.log('🚫 Circuit breaker is OPEN, using fallback');
        return fallbackFn ? await fallbackFn() : this.getFallbackResponse();
      }
    }

    try {
      const startTime = Date.now();
      const result = await fn();
      const responseTime = Date.now() - startTime;
      
      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      this.onFailure(error);
      
      // Try fallback if available
      if (fallbackFn) {
        try {
          console.log('🔄 Using fallback function');
          return await fallbackFn();
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError.message);
        }
      }
      
      throw error;
    }
  }

  onSuccess(responseTime) {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.failures = 0;
    
    // Track response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('✅ Circuit breaker CLOSED after successful recovery');
    }
  }

  onFailure(error) {
    this.failures++;
    this.errorCount++;
    this.lastFailureTime = Date.now();
    
    console.error(`❌ Circuit breaker failure (${this.failures}/${this.failureThreshold}):`, error.message);
    
    if (this.failures >= this.failureThreshold && this.requestCount >= this.minimumRequestCount) {
      this.state = 'OPEN';
      console.log('🚫 Circuit breaker OPENED due to repeated failures');
    }
  }

  getFallbackResponse() {
    return {
      error: 'Service temporarily unavailable',
      circuitBreakerState: this.state,
      retryAfter: this.timeout - (Date.now() - this.lastFailureTime)
    };
  }

  getStats() {
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      failureRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      averageResponseTime: Math.round(avgResponseTime),
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      timeUntilRetry: this.state === 'OPEN' 
        ? Math.max(0, this.timeout - (Date.now() - this.lastFailureTime))
        : 0
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.responseTimes = [];
    console.log('🔄 Circuit breaker manually reset');
  }

  isHealthy() {
    return this.state === 'CLOSED' || 
           (this.state === 'HALF_OPEN' && this.successes > 0);
  }
}

// Specialized circuit breakers for different services
export const flowCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  timeout: 30000, // 30 seconds for Flow API
  minimumRequestCount: 2
});

export const cacheCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  timeout: 15000, // 15 seconds for cache
  minimumRequestCount: 3
});

export const websocketCircuitBreaker = new CircuitBreaker({
  failureThreshold: 2,
  timeout: 10000, // 10 seconds for WebSocket
  minimumRequestCount: 1
});

// Circuit breaker manager
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
    this.breakers.set('flow', flowCircuitBreaker);
    this.breakers.set('cache', cacheCircuitBreaker);
    this.breakers.set('websocket', websocketCircuitBreaker);
  }

  getBreaker(name) {
    return this.breakers.get(name);
  }

  getAllStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  getOverallHealth() {
    const healthyBreakers = Array.from(this.breakers.values())
      .filter(breaker => breaker.isHealthy()).length;
    
    return {
      totalBreakers: this.breakers.size,
      healthyBreakers,
      overallStatus: healthyBreakers === this.breakers.size ? 'healthy' : 'degraded'
    };
  }
}

export const circuitBreakerManager = new CircuitBreakerManager(); 