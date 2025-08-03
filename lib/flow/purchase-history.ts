import * as fcl from '@onflow/fcl';

// Configure FCL for mainnet
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "flow.network": "mainnet",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
});

// Contract addresses
const ALLDAY_ADDRESS = "0xe4cf4bdc1751c65d";
const MARKETPLACE_ADDRESS = "0xb8ea91944fd8f439";
const DUC_ADDRESS = "0xead892083b3e2c6c";

export interface PurchaseHistory {
  momentId: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  transactionId?: string;
  seller?: string;
  buyer?: string;
  source: 'marketplace' | 'pack' | 'transfer' | 'unknown';
}

// Script to get moment metadata including minted date
const GET_MOMENT_METADATA = `
import AllDay from 0xe4cf4bdc1751c65d
import MetadataViews from 0x1d7e57aa55817448

pub fun main(address: Address, momentID: UInt64): {String: AnyStruct}? {
    let account = getAccount(address)
    
    let collectionRef = account.getCapability(AllDay.CollectionPublicPath)
        .borrow<&{AllDay.MomentNFTCollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")
    
    if let moment = collectionRef.borrowMomentNFT(id: momentID) {
        let metadata: {String: AnyStruct} = {}
        
        // Get basic info
        metadata["id"] = moment.id
        metadata["editionID"] = moment.editionID
        metadata["serialNumber"] = moment.serialNumber
        metadata["mintingDate"] = moment.mintingDate
        
        // Try to get play metadata
        if let play = moment.play() {
            metadata["playID"] = play.id
            metadata["classification"] = play.classification
            metadata["metadata"] = play.metadata
        }
        
        return metadata
    }
    
    return nil
}
`;

// Get events for a specific transaction
const GET_TRANSACTION_EVENTS = `
import AllDay from 0xe4cf4bdc1751c65d

pub fun main(transactionID: String): [AnyStruct] {
    // This would need to be implemented with event querying
    // For now, returns empty
    return []
}
`;

// Function to scan recent blocks for AllDay events
export async function scanRecentEvents(address: string, lookbackBlocks: number = 10000) {
  try {
    // Get current block height
    const latestBlock = await fcl.send([
      fcl.getBlock(true)
    ]).then(fcl.decode);
    
    const startHeight = Math.max(0, latestBlock.height - lookbackBlocks);
    
    // Events to look for
    const DEPOSIT_EVENT = `A.${ALLDAY_ADDRESS}.AllDay.Deposit`;
    const WITHDRAW_EVENT = `A.${ALLDAY_ADDRESS}.AllDay.Withdraw`;
    const MOMENT_PURCHASED = `A.${MARKETPLACE_ADDRESS}.Market.MomentPurchased`;
    
    console.log(`Scanning blocks ${startHeight} to ${latestBlock.height} for address ${address}`);
    
    // Get deposit events (moments received)
    const depositEvents = await fcl.send([
      fcl.getEventsAtBlockHeightRange(
        DEPOSIT_EVENT,
        startHeight,
        latestBlock.height
      )
    ]).then(fcl.decode);
    
    // Filter for our address
    const relevantDeposits = depositEvents.filter((blockEvents: any) => {
      return blockEvents.events.some((event: any) => 
        event.data.to === address
      );
    });
    
    return relevantDeposits;
  } catch (error) {
    console.error('Error scanning events:', error);
    return [];
  }
}

// Get moment metadata from chain
export async function getMomentMetadata(address: string, momentId: string) {
  try {
    const metadata = await fcl.query({
      cadence: GET_MOMENT_METADATA,
      args: (arg: any, t: any) => [
        arg(address, t.Address),
        arg(momentId, t.UInt64)
      ]
    });
    
    return metadata;
  } catch (error) {
    console.error('Error getting moment metadata:', error);
    return null;
  }
}

// Main function to get purchase history for a moment
export async function getMomentPurchaseHistory(
  walletAddress: string,
  momentId: string
): Promise<PurchaseHistory | null> {
  try {
    // First, get moment metadata which includes minting date
    const metadata = await getMomentMetadata(walletAddress, momentId);
    
    if (!metadata) {
      console.log('No metadata found for moment', momentId);
      return null;
    }
    
    // Try to scan recent events for this moment
    // This is limited by Flow's API capabilities
    const events = await scanRecentEvents(walletAddress, 50000);
    
    // For now, return basic info from metadata
    // In production, you'd need a proper indexer or event database
    return {
      momentId,
      purchaseDate: metadata.mintingDate ? new Date(metadata.mintingDate) : undefined,
      source: 'unknown',
      // Price would come from marketplace events
      // which require more sophisticated event scanning
    };
    
  } catch (error) {
    console.error('Error getting purchase history:', error);
    return null;
  }
}

// Helper to format DUC price (8 decimal places)
export function formatDUCPrice(rawPrice: string | number): number {
  const price = typeof rawPrice === 'string' ? parseFloat(rawPrice) : rawPrice;
  return price / 100000000; // DUC has 8 decimal places
}