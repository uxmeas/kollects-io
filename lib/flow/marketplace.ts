import * as fcl from '@onflow/fcl';

// Script to get NFT marketplace data from Flow blockchain
const GET_MARKETPLACE_LISTINGS = `
import TopShot from 0x0b2a3299cc857e29
import Market from 0xc1e4f4f4c4257510

pub fun main(momentId: UInt64): [MarketListing] {
    let listings: [MarketListing] = []
    
    // This would query the actual marketplace contract
    // For now, returning empty array as we need the exact contract addresses
    return listings
}

pub struct MarketListing {
    pub let price: UFix64
    pub let seller: Address
    pub let momentId: UInt64
    
    init(price: UFix64, seller: Address, momentId: UInt64) {
        self.price = price
        self.seller = seller
        self.momentId = momentId
    }
}
`;

// Get TopShot moment metadata directly from blockchain
const GET_MOMENT_METADATA = `
import TopShot from 0x0b2a3299cc857e29

pub fun main(address: Address, id: UInt64): MomentData? {
    let account = getAccount(address)
    
    let collectionRef = account.getCapability(/public/MomentCollection)
        .borrow<&{TopShot.MomentCollectionPublic}>()
    
    if let collection = collectionRef {
        if let moment = collection.borrowMoment(id: id) {
            let data = moment.data
            return MomentData(
                playId: data.playID,
                setId: data.setID,
                serialNumber: data.serialNumber
            )
        }
    }
    
    return nil
}

pub struct MomentData {
    pub let playId: UInt32
    pub let setId: UInt32
    pub let serialNumber: UInt32
    
    init(playId: UInt32, setId: UInt32, serialNumber: UInt32) {
        self.playId = playId
        self.setId = setId
        self.serialNumber = serialNumber
    }
}
`;

// Alternative approach: Use a public GraphQL endpoint
export async function fetchNFLAllDayPrice(momentId: string): Promise<number | null> {
  try {
    // Many NFT projects expose GraphQL endpoints
    // Let's try the public NBA Top Shot API pattern (NFL All Day is similar)
    const response = await fetch('https://public-api.dapperlabs.com/flow/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetMomentPrice($momentId: ID!) {
            getMoment(id: $momentId) {
              id
              price
              forSale
            }
          }
        `,
        variables: { momentId }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data?.data?.getMoment?.price || null;
    }
    
    return null;
  } catch (error) {
    console.error('GraphQL error:', error);
    return null;
  }
}

// Try multiple data sources
export async function getRealMarketPrice(momentId: string): Promise<number | null> {
  // Try different sources in order of preference
  
  // 1. Try direct blockchain query (most accurate but requires setup)
  try {
    const metadata = await fcl.query({
      cadence: GET_MOMENT_METADATA,
      args: (arg: any, t: any) => [
        arg("0xa2c60db5a2545622", t.Address), // example address
        arg(momentId, t.UInt64)
      ]
    });
    console.log('Blockchain metadata:', metadata);
  } catch (error) {
    console.error('Blockchain query error:', error);
  }
  
  // 2. Try public APIs
  const price = await fetchNFLAllDayPrice(momentId);
  if (price) return price;
  
  // 3. Fallback to web scraping (last resort)
  try {
    const response = await fetch(`https://nbatopshot.com/listings/p2p/${momentId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const priceMatch = html.match(/lowestAsk":\s*(\d+)/);
      if (priceMatch) {
        return parseInt(priceMatch[1]);
      }
    }
  } catch (error) {
    console.error('Scraping error:', error);
  }
  
  return null;
}