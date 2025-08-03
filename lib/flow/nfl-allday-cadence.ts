// NFL All Day Cadence Scripts for Flow Blockchain
// These scripts query NFL All Day smart contracts directly

import * as fcl from '@onflow/fcl';

// NFL All Day contract addresses on Flow mainnet
export const NFL_ALLDAY_CONTRACTS = {
  AllDay: '0xe4cf4bdc1751c65d',
  Market: '0x8ebcbfd516b1da27', 
  PackNFT: '0xe4cf4bdc1751c65d',
  DapperUtilityCoin: '0xead892083b3e2c6c',
};

// Configure FCL for Flow mainnet
fcl.config({
  'accessNode.api': 'https://rest-mainnet.onflow.org',
  'flow.network': 'mainnet',
  'discovery.wallet': 'https://fcl-discovery.onflow.org/api/authn',
  'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
});

// Get all NFL All Day moment IDs owned by an address
export const GET_ALLDAY_MOMENT_IDS = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}

pub fun main(address: Address): [UInt64] {
    let account = getAccount(address)
    
    // Try to borrow the public collection capability
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    // Return empty array if collection doesn't exist
    if collectionRef == nil {
        return []
    }
    
    // Get all moment IDs
    return collectionRef!.getIDs()
}
`;

// Get detailed metadata for a specific moment
export const GET_MOMENT_METADATA = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}

pub fun main(address: Address, momentID: UInt64): AllDay.MomentData? {
    let account = getAccount(address)
    
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    if collectionRef == nil {
        return nil
    }
    
    // Borrow the moment NFT
    let nft = collectionRef!.borrowMomentNFT(id: momentID)
    if nft == nil {
        return nil
    }
    
    // Get the moment data
    return AllDay.getMomentData(id: nft!.id)
}
`;

// Check if an account has the NFL All Day collection initialized
export const CHECK_COLLECTION_INITIALIZED = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}

pub fun main(address: Address): Bool {
    let account = getAccount(address)
    
    let collectionRef = account
        .getCapability(/public/AllDayNFTCollection)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
    
    return collectionRef != nil
}
`;

// Get all moments with metadata for a wallet
export async function getAllDayMoments(address: string) {
  try {
    // First check if collection is initialized
    const isInitialized = await fcl.query({
      cadence: CHECK_COLLECTION_INITIALIZED,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });
    
    if (!isInitialized) {
      console.log('NFL All Day collection not initialized for address:', address);
      return [];
    }
    
    // Get all moment IDs
    const momentIds = await fcl.query({
      cadence: GET_ALLDAY_MOMENT_IDS,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });
    
    if (!momentIds || momentIds.length === 0) {
      return [];
    }
    
    // Get metadata for each moment
    const moments = [];
    for (const id of momentIds) {
      try {
        const metadata = await fcl.query({
          cadence: GET_MOMENT_METADATA,
          args: (arg: any, t: any) => [
            arg(address, t.Address),
            arg(id, t.UInt64),
          ],
        });
        
        if (metadata) {
          moments.push({
            id: id.toString(),
            ...metadata,
          });
        }
      } catch (error) {
        console.error(`Error fetching moment ${id}:`, error);
      }
    }
    
    return moments;
  } catch (error) {
    console.error('Error fetching NFL All Day moments:', error);
    return [];
  }
}

// Monitor Flow events for NFL All Day transactions
export async function subscribeToAllDayEvents(address: string, callback: (event: any) => void) {
  // Subscribe to specific event types
  const eventTypes = [
    `A.${NFL_ALLDAY_CONTRACTS.AllDay.slice(2)}.AllDay.Deposit`,
    `A.${NFL_ALLDAY_CONTRACTS.AllDay.slice(2)}.AllDay.Withdraw`,
    `A.${NFL_ALLDAY_CONTRACTS.Market.slice(2)}.Market.MomentPurchased`,
    `A.${NFL_ALLDAY_CONTRACTS.AllDay.slice(2)}.AllDay.PackOpened`,
  ];
  
  // This would require a WebSocket connection or event streaming service
  // For now, we'll use polling as a fallback
  console.log('Event subscription would monitor:', eventTypes);
  
  // In production, use QuickNode Streams or similar service
  // for real-time event monitoring
}

// Query for marketplace purchase events
export const GET_PURCHASE_EVENTS = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}
import Market from ${NFL_ALLDAY_CONTRACTS.Market}

// This script would need to be implemented server-side
// as it requires event querying capabilities
pub fun main(address: Address, momentID: UInt64): {String: AnyStruct}? {
    // Event querying is not directly available in Cadence scripts
    // This would need to be done through an indexer service
    return nil
}
`;

// Helper function to parse moment metadata
export function parseMomentMetadata(metadata: any) {
  return {
    id: metadata.id,
    playID: metadata.play?.id,
    editionID: metadata.editionID,
    serialNumber: metadata.serialNumber,
    mintingDate: metadata.mintingDate,
    player: {
      name: metadata.play?.metadata?.playerName || 'Unknown Player',
      position: metadata.play?.metadata?.playerPosition,
      team: metadata.play?.metadata?.teamName,
    },
    playType: metadata.play?.metadata?.playType,
    description: metadata.play?.description,
    series: metadata.series?.name,
    imageUrl: `https://media.nflallday.com/editions/${metadata.editionID}/play_${metadata.play?.id}_capture_Hero_Black_2880_2880_Animated.mp4`,
  };
}

// Get moment price from marketplace
export async function getMarketplacePrice(momentId: string): Promise<number | null> {
  try {
    // This would query the Market contract for active listings
    // For now, we'll use the existing price API
    const response = await fetch(`/api/prices/${momentId}`);
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching marketplace price:', error);
    return null;
  }
}

// Initialize NFL All Day collection for an account (requires transaction)
export const INIT_COLLECTION_TRANSACTION = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}
import NonFungibleToken from 0x1d7e57aa55817448
import MetadataViews from 0x1d7e57aa55817448

transaction {
    prepare(acct: AuthAccount) {
        // Check if collection already exists
        if acct.borrow<&AllDay.Collection>(from: /storage/AllDayNFTCollection) == nil {
            // Create a new empty collection
            let collection <- AllDay.createEmptyCollection()
            
            // Save it to the account
            acct.save(<-collection, to: /storage/AllDayNFTCollection)
            
            // Create a public capability for the collection
            acct.link<&AllDay.Collection{AllDay.MomentNFTCollectionPublic, NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, MetadataViews.ResolverCollection}>(
                /public/AllDayNFTCollection,
                target: /storage/AllDayNFTCollection
            )
        }
    }
}
`;

// Export useful constants
export const COLLECTION_PATHS = {
  storage: '/storage/AllDayNFTCollection',
  public: '/public/AllDayNFTCollection',
};

export const MEDIA_GATEWAY_BASE = 'https://media.nflallday.com';

// Helper to construct media URLs
export function getMediaUrl(editionID: string, playID: string, type: 'image' | 'video' = 'video') {
  if (type === 'video') {
    return `${MEDIA_GATEWAY_BASE}/editions/${editionID}/play_${playID}_capture_Hero_Black_2880_2880_Animated.mp4`;
  } else {
    return `${MEDIA_GATEWAY_BASE}/editions/${editionID}/play_${playID}_capture_Hero_Black_2880_2880.png`;
  }
}