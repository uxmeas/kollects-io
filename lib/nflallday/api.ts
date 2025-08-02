// NFL All Day API integration
// This uses public endpoints that don't require authentication

interface MomentListingData {
  price: number;
  serialNumber: string;
  momentId: string;
}

interface PlayMetadata {
  playId: string;
  playerName: string;
  teamName: string;
  playType: string;
  series: string;
  setName: string;
}

// Get lowest listing price for a moment
export async function getLowestPrice(momentId: string): Promise<number | null> {
  try {
    // NFL All Day uses a GraphQL API - this is a public endpoint
    const response = await fetch('https://nflallday.com/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetMomentListings($momentId: String!) {
            getMomentListings(momentId: $momentId, limit: 1, sortBy: PRICE_ASC) {
              listings {
                price
                serialNumber
              }
            }
          }
        `,
        variables: { momentId }
      })
    });

    const data = await response.json();
    const listings = data?.data?.getMomentListings?.listings;
    
    if (listings && listings.length > 0) {
      return listings[0].price;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching price for moment', momentId, error);
    return null;
  }
}

// Get moment metadata
export async function getMomentMetadata(momentId: string): Promise<PlayMetadata | null> {
  try {
    // Try the public API endpoint
    const response = await fetch(`https://nflallday.com/api/moments/${momentId}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        playId: data.playId,
        playerName: data.player?.displayName || 'Unknown Player',
        teamName: data.team?.name || 'Unknown Team',
        playType: data.playType || 'Unknown Play',
        series: data.series || 'Unknown Series',
        setName: data.setName || 'Unknown Set'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching metadata for moment', momentId, error);
    return null;
  }
}

// Alternative: Use FlowtyDrops API (they have some public endpoints)
export async function getFlowtyPrice(momentId: string): Promise<number | null> {
  try {
    // FlowtyDrops has a public API for NFT prices
    const response = await fetch(`https://api.flowty.io/v1/nflallday/moments/${momentId}/price`);
    
    if (response.ok) {
      const data = await response.json();
      return data.lowestPrice || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Flowty price:', error);
    return null;
  }
}

// Get batch prices for multiple moments
export async function getBatchPrices(momentIds: string[]): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {};
  
  // Process in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < momentIds.length; i += batchSize) {
    const batch = momentIds.slice(i, i + batchSize);
    
    // Try to get prices in parallel
    const pricePromises = batch.map(async (momentId) => {
      const price = await getLowestPrice(momentId);
      return { momentId, price };
    });
    
    const results = await Promise.all(pricePromises);
    results.forEach(({ momentId, price }) => {
      prices[momentId] = price;
    });
    
    // Add a small delay between batches to be respectful
    if (i + batchSize < momentIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return prices;
}