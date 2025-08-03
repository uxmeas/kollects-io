// NFL All Day Blockchain Indexer
// Uses multiple sources to fetch transaction data

import * as fcl from '@onflow/fcl';

// NFL All Day contract addresses on Flow mainnet
export const NFL_ALLDAY_CONTRACTS = {
  AllDay: '0xe4cf4bdc1751c65d',
  Market: '0x8ebcbfd516b1da27',
  PackNFT: '0xe4cf4bdc1751c65d',
};

// Configure FCL for mainnet
fcl.config({
  'accessNode.api': 'https://rest-mainnet.onflow.org',
  'flow.network': 'mainnet',
});

// Interface for purchase data
export interface PurchaseData {
  momentId: string;
  purchasePrice: number;
  purchaseDate: string;
  seller: string;
  buyer: string;
  transactionId: string;
  source: 'blockchain' | 'bitquery' | 'flowscan' | 'manual';
}

// Query moment ownership history using FCL
export async function getMomentHistory(momentId: string): Promise<any> {
  try {
    // This script would query the AllDay contract for moment history
    const script = `
import AllDay from ${NFL_ALLDAY_CONTRACTS.AllDay}

pub fun main(momentFlowID: UInt64): {String: AnyStruct}? {
    // Get the moment metadata
    let metadata = AllDay.getMomentData(id: momentFlowID)
    return metadata
}
    `;
    
    const result = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(momentId, t.UInt64)],
    });
    
    return result;
  } catch (error) {
    console.error('Error querying moment history:', error);
    return null;
  }
}

// Use Bitquery API to get Flow blockchain data
export async function getBitqueryTransactionData(
  address: string,
  contractAddress: string = NFL_ALLDAY_CONTRACTS.AllDay
): Promise<PurchaseData[]> {
  const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY;
  
  if (!BITQUERY_API_KEY) {
    console.warn('Bitquery API key not set. Set BITQUERY_API_KEY in .env');
    return [];
  }
  
  const query = `
    query GetNFTTransfers($address: String!, $contract: String!) {
      flow {
        transfers(
          currency: {is: $contract}
          receiver: {is: $address}
          options: {desc: "block.timestamp.time", limit: 1000}
        ) {
          transaction {
            hash
          }
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
            height
          }
          sender {
            address
          }
          receiver {
            address
          }
          tokenId
          amount
          value
        }
      }
    }
  `;
  
  try {
    const response = await fetch('https://graphql.bitquery.io/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BITQUERY_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: {
          address: address,
          contract: contractAddress,
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.data?.flow?.transfers) {
      return data.data.flow.transfers.map((transfer: any) => ({
        momentId: transfer.tokenId,
        purchasePrice: parseFloat(transfer.value || '0'),
        purchaseDate: transfer.block.timestamp.time,
        seller: transfer.sender.address,
        buyer: transfer.receiver.address,
        transactionId: transfer.transaction.hash,
        source: 'bitquery' as const,
      }));
    }
  } catch (error) {
    console.error('Bitquery API error:', error);
  }
  
  return [];
}

// Query Flow events for marketplace purchases
export async function getMarketplaceEvents(address: string): Promise<PurchaseData[]> {
  try {
    // Query for MomentPurchased events
    const script = `
import Market from ${NFL_ALLDAY_CONTRACTS.Market}

pub fun main(address: Address): [{String: AnyStruct}] {
    // This would need to be implemented to query events
    // For now, return empty array
    return []
}
    `;
    
    const result = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(address, t.Address)],
    });
    
    return result || [];
  } catch (error) {
    console.error('Error querying marketplace events:', error);
    return [];
  }
}

// Aggregate data from multiple sources
export async function getCompletePurchaseHistory(
  walletAddress: string,
  momentIds: string[]
): Promise<Map<string, PurchaseData>> {
  const purchaseMap = new Map<string, PurchaseData>();
  
  // 1. Try Bitquery API
  const bitqueryData = await getBitqueryTransactionData(walletAddress);
  bitqueryData.forEach(purchase => {
    if (momentIds.includes(purchase.momentId)) {
      purchaseMap.set(purchase.momentId, purchase);
    }
  });
  
  // 2. Try direct blockchain queries for missing moments
  for (const momentId of momentIds) {
    if (!purchaseMap.has(momentId)) {
      const history = await getMomentHistory(momentId);
      if (history) {
        // Parse history data if available
        console.log('Moment history:', history);
      }
    }
  }
  
  // 3. Check localStorage for manual entries
  momentIds.forEach(momentId => {
    if (!purchaseMap.has(momentId)) {
      const storageKey = `purchase_${walletAddress}_${momentId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          purchaseMap.set(momentId, {
            momentId,
            purchasePrice: data.purchasePrice,
            purchaseDate: data.purchaseDate,
            seller: 'unknown',
            buyer: walletAddress,
            transactionId: 'manual-entry',
            source: 'manual',
          });
        } catch (e) {
          console.error('Error parsing saved data:', e);
        }
      }
    }
  });
  
  return purchaseMap;
}

// Helper function to format DUC (Dapper Utility Coin) to USD
export function ducToUSD(ducAmount: string | number): number {
  // DUC has 8 decimal places
  const duc = typeof ducAmount === 'string' ? parseFloat(ducAmount) : ducAmount;
  return duc / 100000000;
}

// Parse Flow event data
export function parseFlowEvent(event: any): PurchaseData | null {
  if (event.type?.includes('MomentPurchased')) {
    return {
      momentId: event.data?.id || event.values?.['1']?.value,
      purchasePrice: ducToUSD(event.data?.price || event.values?.['2']?.value || '0'),
      purchaseDate: new Date(event.blockTimestamp || event.time).toISOString(),
      seller: event.data?.seller || event.values?.['3']?.value,
      buyer: event.data?.buyer || event.values?.['4']?.value,
      transactionId: event.transactionId,
      source: 'blockchain',
    };
  }
  return null;
}

// Export function to scan for acquisition type
export async function scanMomentAcquisition(walletAddress: string, momentId: string) {
  // Check multiple sources to determine how the moment was acquired
  const purchaseHistory = await getCompletePurchaseHistory(walletAddress, [momentId]);
  const purchase = purchaseHistory.get(momentId);
  
  if (purchase) {
    return {
      acquisitionType: 'purchase' as const,
      price: purchase.purchasePrice,
      date: purchase.purchaseDate,
      seller: purchase.seller,
      transactionId: purchase.transactionId,
    };
  }
  
  // If no purchase found, might be a gift/pack opening
  return {
    acquisitionType: 'gift' as const,
    price: 0,
    date: new Date().toISOString(),
    seller: null,
    transactionId: null,
  };
}