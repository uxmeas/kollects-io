// Enhanced Flow API Service with Redis Caching
// Extends the base Flow API service with caching capabilities

import { cacheService } from './redis-cache.js';
import { flowCircuitBreaker, cacheCircuitBreaker } from './circuit-breaker.js';

// Import the base FlowAPIService class
class FlowAPIService {
  constructor() {
    this.QUICKNODE_FLOW_ENDPOINT = 'https://radial-maximum-snowflake.flow-mainnet.quiknode.pro/54979bcefb63d671f5f5d1be5e5311c967e799c2/v1/scripts';
    this.PUBLIC_FLOW_ENDPOINT = 'https://rest-mainnet.onflow.org/v1/scripts';
  }

  encodeValue(value) {
    if (typeof value === 'string') {
      return Buffer.from(JSON.stringify({
        type: 'String',
        value: value
      })).toString('base64');
    } else if (typeof value === 'number') {
      return Buffer.from(JSON.stringify({
        type: 'UInt64',
        value: value.toString()
      })).toString('base64');
    } else if (typeof value === 'object' && value.type && value.value) {
      return Buffer.from(JSON.stringify(value)).toString('base64');
    }
    return Buffer.from(JSON.stringify(value)).toString('base64');
  }

  async executeScript(script, args = []) {
    return await flowCircuitBreaker.execute(
      async () => {
        const response = await fetch(this.QUICKNODE_FLOW_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: Buffer.from(script).toString('base64'),
            arguments: args
          })
        });

        if (!response.ok) {
          throw new Error(`QuickNode API error: ${response.status}`);
        }

        return await response.json();
      },
      async () => {
        console.log('🔄 Flow circuit breaker fallback: using public endpoint');
        return await this.callPublicEndpoint(script, args);
      }
    );
  }

  async callPublicEndpoint(script, args) {
    const response = await fetch(this.PUBLIC_FLOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: Buffer.from(script).toString('base64'),
        arguments: args
      })
    });

    if (!response.ok) {
      throw new Error(`Public Flow API error: ${response.status}`);
    }

    return await response.json();
  }

  parseCollectionIds(result) {
    if (result && result.value) {
      try {
        const decoded = Buffer.from(result.value, 'base64').toString('utf-8');
        return JSON.parse(decoded);
      } catch (error) {
        console.error('Error parsing collection IDs:', error);
        return [];
      }
    }
    return [];
  }

  parseMomentData(result) {
    if (result && result.value) {
      try {
        const decoded = Buffer.from(result.value, 'base64').toString('utf-8');
        return JSON.parse(decoded);
      } catch (error) {
        console.error('Error parsing moment data:', error);
        return null;
      }
    }
    return null;
  }
}

// Enhanced Flow API Service with caching
export class EnhancedFlowAPIService extends FlowAPIService {
  constructor() {
    super();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0
    };
  }

  async getTopShotCollectionIds(accountAddress) {
    const cacheKey = `topshot-collection-${accountAddress}`;
    
    return await cacheCircuitBreaker.execute(
      async () => {
        return await cacheService.getOrSet(
          cacheKey,
          async () => {
            console.log(`🔍 Fetching TopShot collection for ${accountAddress} from blockchain`);
            
            const script = `
import TopShot from 0x0b2a3299cc857e29
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    
    // Try multiple collection paths
    let likelyPaths = [
        "topShotCollection",
        "TopShotCollection", 
        "momentCollection",
        "topshotCollection"
    ]
    
    for path in likelyPaths {
        if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/${path}) {
            return collectionRef.getIDs()
        }
    }
    
    return []
}`;
            
            const args = [this.encodeValue(accountAddress)];
            const result = await this.executeScript(script, args);
            const collectionIds = this.parseCollectionIds(result);
            
            console.log(`✅ Retrieved ${collectionIds.length} TopShot moments for ${accountAddress}`);
            return collectionIds;
          },
          900 // 15 minutes cache
        );
      },
      async () => {
        console.log('🔄 Cache circuit breaker fallback: returning empty collection');
        return [];
      }
    );
  }

  async getTopShotMomentDetails(accountAddress, momentId) {
    const cacheKey = `topshot-moment-${accountAddress}-${momentId}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`🔍 Fetching TopShot moment ${momentId} details from blockchain`);
        
        const script = `
import TopShot from 0x0b2a3299cc857e29
import MetadataViews from 0x1d7e57aa55817448

access(all) fun main(account: Address, momentID: UInt64): {String: AnyStruct}? {
    let acct = getAccount(account)
    
    // Try common TopShot collection paths
    let paths = [
        "/public/topshotCollection",
        "/public/MomentCollection",
        "/public/Collection"
    ]
    
    for path in paths {
        if let capability = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(path) {
            if let moment = capability.borrowView(id: momentID) {
                return {
                    "id": momentID,
                    "player": "Sample Player",
                    "team": "Sample Team",
                    "playDescription": "Sample Play",
                    "serialNumber": 1,
                    "setName": "Sample Set",
                    "rarity": "Common"
                }
            }
        }
    }
    
    return nil
}`;
        
        const args = [
          this.encodeValue(accountAddress),
          this.encodeValue(momentId)
        ];
        const result = await this.executeScript(script, args);
        const momentData = this.parseMomentData(result);
        
        console.log(`✅ Retrieved moment ${momentId} details`);
        return momentData;
      },
      1800 // 30 minutes for detailed data
    );
  }

  async getAllDayCollectionIds(accountAddress) {
    const cacheKey = `allday-collection-${accountAddress}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`🔍 Fetching AllDay collection for ${accountAddress} from blockchain`);
        
        const script = `
import AllDay from 0xe4cf4bdc1751c65d
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): [UInt64] {
    let acct = getAccount(account)
    
    // Try multiple collection paths
    let likelyPaths = [
        "allDayCollection",
        "AllDayCollection", 
        "momentCollection",
        "collection"
    ]
    
    for path in likelyPaths {
        if let collectionRef = acct.capabilities.borrow<&{NonFungibleToken.Collection}>(/public/${path}) {
            return collectionRef.getIDs()
        }
    }
    
    return []
}`;
        
        const args = [this.encodeValue(accountAddress)];
        const result = await this.executeScript(script, args);
        const collectionIds = this.parseCollectionIds(result);
        
        console.log(`✅ Retrieved ${collectionIds.length} AllDay moments for ${accountAddress}`);
        return collectionIds;
      },
      900 // 15 minutes cache
    );
  }

  async getPortfolioData(accountAddress) {
    const cacheKey = `portfolio-${accountAddress}`;
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        console.log(`🔍 Fetching portfolio data for ${accountAddress} from blockchain`);
        
        // Get both TopShot and AllDay collections
        const [topShotIds, allDayIds] = await Promise.all([
          this.getTopShotCollectionIds(accountAddress),
          this.getAllDayCollectionIds(accountAddress)
        ]);
        
        const portfolioData = {
          walletAddress: accountAddress,
          portfolio: {
            totalMoments: topShotIds.length + allDayIds.length,
            totalValue: 100, // Placeholder value
            lastUpdated: new Date().toISOString()
          },
          topShotCollection: topShotIds.map(id => ({
            id,
            type: 'NBA Top Shot',
            estimatedValue: 50 // Placeholder
          })),
          allDayCollection: allDayIds.map(id => ({
            id,
            type: 'NFL All Day',
            estimatedValue: 50 // Placeholder
          }))
        };
        
        console.log(`✅ Portfolio data compiled for ${accountAddress}`);
        return portfolioData;
      },
      600 // 10 minutes cache for portfolio data
    );
  }

  async getCacheStats() {
    const stats = await cacheService.getStats();
    return {
      ...stats,
      apiStats: this.cacheStats
    };
  }

  async clearCache(pattern = '*') {
    return await cacheService.invalidate(pattern);
  }

  async refreshPortfolio(accountAddress) {
    // Force refresh by clearing cache and re-fetching
    await this.clearCache(`portfolio-${accountAddress}`);
    await this.clearCache(`topshot-collection-${accountAddress}`);
    await this.clearCache(`allday-collection-${accountAddress}`);
    
    return await this.getPortfolioData(accountAddress);
  }
}

export default EnhancedFlowAPIService; 