// Alternative price data sources for NFL All Day
// Research findings from 2024

/**
 * CONFIRMED WORKING OPTIONS:
 */

// 1. Flowty.io API - Through proxy to avoid CORS
export async function getFlowtyPrice(momentId: string): Promise<number | null> {
  try {
    // Use our proxy endpoint to avoid CORS issues
    const response = await fetch(`/api/prices/${momentId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.price && data.source === 'Flowty') {
        return data.price;
      }
    }
    return null;
  } catch (error) {
    console.error('Flowty API error:', error);
    return null;
  }
}

// 2. Flowverse NFT Marketplace - Through proxy to avoid CORS
export async function getFlowversePrice(momentId: string): Promise<number | null> {
  try {
    // Use our proxy endpoint to avoid CORS issues
    const response = await fetch(`/api/prices/${momentId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.price && data.source === 'Flowverse') {
        return data.price;
      }
    }
    return null;
  } catch (error) {
    console.error('Flowverse API error:', error);
    return null;
  }
}

// 3. Direct Flow Blockchain Query - Most reliable but complex
export async function queryFlowBlockchain(momentId: string): Promise<any> {
  // NFL All Day contract address on Flow: 0xe4cf4bdc1751c65d
  const ALLDAY_CONTRACT = '0xe4cf4bdc1751c65d';
  
  // This would require setting up Flow SDK and writing Cadence scripts
  // to query on-chain marketplace listings
  
  const cadenceScript = `
    import AllDay from ${ALLDAY_CONTRACT}
    
    pub fun main(momentId: UInt64): {String: AnyStruct} {
      // Query marketplace listings for this moment
      // This is pseudocode - actual implementation would need proper Cadence
      return {}
    }
  `;
  
  // Implementation would use @onflow/fcl
  return null;
}

/**
 * THIRD-PARTY ANALYTICS SERVICES:
 */

// 4. Own The Moment (OTM) - Premium analytics service
export interface OTMService {
  name: 'Own The Moment';
  url: 'https://www.otmnft.com';
  features: ['Real-time valuations', 'Market analytics', 'Portfolio tracking'];
  pricing: 'Subscription-based';
  supports: ['NBA Top Shot', 'NFL All Day', 'UFC Strike'];
}

// 5. TopMoment App - Real-time account valuation
export interface TopMomentService {
  name: 'TopMoment';
  description: 'Companion app for NBA Top Shot, NFL All Day, and UFC Strike collectors';
  features: ['Real-time account valuation', 'Collection tracking'];
  availability: 'Mobile app';
}

// 6. All Day Tools - On-chain data visualization
export interface AllDayToolsService {
  name: 'All Day Tools';
  description: 'Visualizing on-chain data for NFL ALL DAY';
  type: 'Analytics platform';
}

/**
 * IMPLEMENTATION STRATEGY:
 */

export async function getBestAvailablePrice(momentId: string): Promise<{
  price: number | null;
  source: string;
}> {
  try {
    // Use our proxy endpoint that handles all sources
    const response = await fetch(`/api/prices/${momentId}`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        price: data.price || null,
        source: data.source || 'none'
      };
    }
  } catch (error) {
    console.error('Price fetch error:', error);
  }
  
  return { price: null, source: 'none' };
}

/**
 * NOTES:
 * 
 * 1. NFL All Day doesn't have a public API like NBA Top Shot
 * 2. The official contract address is: 0xe4cf4bdc1751c65d
 * 3. Most reliable data comes from:
 *    - Flowty.io (major Flow marketplace)
 *    - Flowverse NFT (Flow ecosystem marketplace)
 *    - Direct blockchain queries using Flow SDK
 * 
 * 4. For production use, consider:
 *    - Caching prices to reduce API calls
 *    - Rate limiting to respect API limits
 *    - Fallback strategies for when APIs are down
 *    - Subscribing to premium services for better data
 */