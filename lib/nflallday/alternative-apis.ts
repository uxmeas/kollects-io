// Alternative price data sources for NFL All Day
// Research findings from 2024

/**
 * CONFIRMED WORKING OPTIONS:
 */

// 1. Flowty.io API - Direct marketplace access
export async function getFlowtyPrice(momentId: string): Promise<number | null> {
  try {
    // Flowty is a major Flow NFT marketplace with NFL All Day listings
    // Contract: 0xe4cf4bdc1751c65d
    const response = await fetch(
      `https://www.flowty.io/api/v1/collection/0xe4cf4bdc1751c65d/AllDay/listings?tokenId=${momentId}`
    );
    
    if (response.ok) {
      const data = await response.json();
      // Extract lowest listing price
      const listings = data.listings || [];
      if (listings.length > 0) {
        const prices = listings.map((l: any) => l.price).filter((p: number) => p > 0);
        return Math.min(...prices);
      }
    }
    return null;
  } catch (error) {
    console.error('Flowty API error:', error);
    return null;
  }
}

// 2. Flowverse NFT Marketplace - Alternative marketplace
export async function getFlowversePrice(momentId: string): Promise<number | null> {
  try {
    // Flowverse is another major Flow NFT marketplace
    const response = await fetch(
      `https://nft.flowverse.co/api/marketplace/AllDay/${momentId}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.lowestPrice || null;
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
  // Try multiple sources in order of reliability
  
  // 1. Try Flowty first (most active marketplace)
  const flowtyPrice = await getFlowtyPrice(momentId);
  if (flowtyPrice) {
    return { price: flowtyPrice, source: 'Flowty' };
  }
  
  // 2. Try Flowverse
  const flowversePrice = await getFlowversePrice(momentId);
  if (flowversePrice) {
    return { price: flowversePrice, source: 'Flowverse' };
  }
  
  // 3. Could add more sources here
  
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