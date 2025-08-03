// Bitquery client for Flow blockchain data
// Docs: https://docs.bitquery.io/docs/graphql/dataset/flow/

const BITQUERY_ENDPOINT = 'https://graphql.bitquery.io';

// You need to get an API key from https://bitquery.io/
const BITQUERY_API_KEY = process.env.BITQUERY_API_KEY || '';

export interface TokenTransfer {
  transactionHash: string;
  from: string;
  to: string;
  tokenId: string;
  value?: number;
  timestamp: string;
  blockHeight: number;
}

export interface PurchaseData {
  momentId: string;
  purchasePrice?: number;
  purchaseDate?: string;
  purchaseTx?: string;
  from?: string;
  to?: string;
}

// Get all transfers for a specific NFT token
export async function getNFTTransferHistory(contractAddress: string, tokenId: string): Promise<TokenTransfer[]> {
  const query = `
    query GetNFTTransfers($contract: String!, $tokenId: String!) {
      flow {
        transfers(
          currency: {is: $contract}
          tokenId: {is: $tokenId}
          options: {desc: "block.timestamp.time", limit: 100}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
            height
          }
          transaction {
            hash
          }
          sender {
            address
          }
          receiver {
            address
          }
          tokenId
          currency {
            symbol
            address
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(BITQUERY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BITQUERY_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: {
          contract: contractAddress,
          tokenId: tokenId
        }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Bitquery errors:', data.errors);
      return [];
    }

    return data.data.flow.transfers.map((transfer: any) => ({
      transactionHash: transfer.transaction.hash,
      from: transfer.sender.address,
      to: transfer.receiver.address,
      tokenId: transfer.tokenId,
      timestamp: transfer.block.timestamp.time,
      blockHeight: transfer.block.height
    }));
  } catch (error) {
    console.error('Bitquery API error:', error);
    return [];
  }
}

// Get transfers for a wallet address
export async function getWalletNFTTransfers(walletAddress: string, contractAddress: string) {
  const query = `
    query GetWalletTransfers($wallet: String!, $contract: String!) {
      flow {
        transfers(
          receiver: {is: $wallet}
          currency: {is: $contract}
          options: {desc: "block.timestamp.time", limit: 100}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
            height
          }
          transaction {
            hash
          }
          sender {
            address
          }
          receiver {
            address
          }
          tokenId
          currency {
            symbol
            address
          }
          # Try to get associated payments
          transaction {
            hash
            transfers {
              currency {
                symbol
                address
              }
              amount
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(BITQUERY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BITQUERY_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: {
          wallet: walletAddress,
          contract: contractAddress
        }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('Bitquery errors:', data.errors);
      return [];
    }

    return data.data.flow.transfers;
  } catch (error) {
    console.error('Bitquery API error:', error);
    return [];
  }
}

// Get purchase data for a specific moment owned by a wallet
export async function getMomentPurchaseData(
  walletAddress: string, 
  momentId: string
): Promise<PurchaseData | null> {
  // NFL All Day contract address
  const ALLDAY_CONTRACT = '0xe4cf4bdc1751c65d';
  
  try {
    // Get transfer history for this specific token
    const transfers = await getNFTTransferHistory(ALLDAY_CONTRACT, momentId);
    
    // Find the transfer TO this wallet
    const purchaseTransfer = transfers.find(t => 
      t.to.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (!purchaseTransfer) {
      return null;
    }

    // TODO: Query for associated DUC payment in same transaction
    // This would show the actual purchase price
    
    return {
      momentId,
      purchaseDate: purchaseTransfer.timestamp,
      purchaseTx: purchaseTransfer.transactionHash,
      from: purchaseTransfer.from,
      to: purchaseTransfer.to
    };
  } catch (error) {
    console.error('Error getting purchase data:', error);
    return null;
  }
}