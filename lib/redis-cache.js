// Redis Cache Service for kollects.io
// Provides caching layer with fallback to in-memory storage

import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.defaultTTL = 900; // 15 minutes
    this.initializeRedis();
  }

  async initializeRedis() {
    // Skip Redis initialization in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('ℹ️ Development mode: using in-memory cache (Redis disabled)');
      this.redis = null;
      return;
    }

    // Only try Redis in production with explicit REDIS_URL
    if (!process.env.REDIS_URL) {
      console.log('ℹ️ No REDIS_URL configured, using in-memory cache');
      this.redis = null;
      return;
    }

    try {
      this.redis = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 0,
        maxRetriesPerRequest: 0,
        retryDelayOnClusterDown: 0,
        enableReadyCheck: false,
        enableOfflineQueue: false,
        lazyConnect: true,
        connectTimeout: 1000,
        commandTimeout: 500,
        maxLoadingTimeout: 500,
      });

      // Suppress Redis error events in development
      this.redis.on('error', (err) => {
        // Only log errors in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Redis error:', err);
        }
      });

      // Quick connection test
      await this.redis.ping();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.log('ℹ️ Redis not available, using in-memory cache (fallback mode)');
      this.redis = null;
    }
  }

  async get(key) {
    try {
      if (this.redis) {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback to in-memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        }
        this.memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
        return true;
      } else {
        // Fallback to in-memory cache
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      } else {
        // Fallback to in-memory cache
        let deletedCount = 0;
        for (const [key] of this.memoryCache) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key);
            deletedCount++;
          }
        }
        return deletedCount;
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
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

  async clear() {
    try {
      if (this.redis) {
        await this.redis.flushall();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async getStats() {
    try {
      if (this.redis) {
        const info = await this.redis.info();
        const keys = await this.redis.dbsize();
        return {
          type: 'redis',
          keys,
          info: info.split('\r\n').slice(0, 10).join('\n') // First 10 lines
        };
      } else {
        return {
          type: 'memory',
          keys: this.memoryCache.size,
          info: 'In-memory cache fallback'
        };
      }
    } catch (error) {
      return {
        type: 'error',
        keys: 0,
        info: error.message
      };
    }
  }

  // Clean up expired in-memory cache entries
  cleanup() {
    if (!this.redis) {
      const now = Date.now();
      for (const [key, cached] of this.memoryCache) {
        if (cached.expiry <= now) {
          this.memoryCache.delete(key);
        }
      }
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

export default cacheService; 