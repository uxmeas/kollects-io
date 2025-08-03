// Graffle API client - they provide Flow blockchain data
// This is used by many Flow NFT projects

const GRAFFLE_API = 'https://prod-main-net-dashboard-api.azurewebsites.net/api';

export interface GraffleTransaction {
  blockHeight: number;
  blockId: string;
  transactionId: string;
  timestamp: string;
  events: any[];
}

export interface MomentSale {
  momentId: string;
  price: number;
  seller: string;
  buyer: string;
  timestamp: string;
  transactionId: string;
}

// Get account transactions
export async function getAccountTransactions(address: string, limit: number = 100) {
  try {
    const response = await fetch(
      `${GRAFFLE_API}/accounts/${address}/transactions?limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Graffle API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Graffle API error:', error);
    return null;
  }
}

// Search for NFL All Day events
export async function searchAllDayEvents(address: string) {
  const ALLDAY_EVENTS = [
    'AllDay.Deposit',
    'AllDay.Withdraw', 
    'AllDay.MomentMinted',
    'Market.MomentPurchased',
    'DapperUtilityCoin.TokensWithdrawn'
  ];
  
  try {
    const response = await fetch(
      `${GRAFFLE_API}/accounts/${address}/events?` + 
      `eventTypes=${ALLDAY_EVENTS.join(',')}&limit=1000`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Graffle API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching events:', error);
    return null;
  }
}

// Alternative: Use FlowScan's undocumented API
export async function getFlowScanTransactions(address: string, contractAddress: string = '0xe4cf4bdc1751c65d') {
  try {
    // FlowScan has some endpoints that might work
    const response = await fetch(
      `https://flowscan.org/api/account/${address}/transfers/${contractAddress}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(
        `https://flowscan.org/account/${address}/transactions`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (altResponse.ok) {
        return await altResponse.json();
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('FlowScan API error:', error);
    return null;
  }
}

// Parse NFL All Day marketplace events
export function parseMarketplaceEvent(event: any): MomentSale | null {
  if (event.type?.includes('MomentPurchased')) {
    return {
      momentId: event.data?.id || event.values?.id,
      price: parseFloat(event.data?.price || event.values?.price || '0') / 100000000, // Convert from DUC
      seller: event.data?.seller || event.values?.seller,
      buyer: event.data?.buyer || event.values?.buyer,
      timestamp: event.time || event.timestamp,
      transactionId: event.transactionId
    };
  }
  return null;
}