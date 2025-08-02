import * as fcl from '@onflow/fcl';

// Event definitions for NFL All Day
export const EVENT_NAMES = {
  // When a moment is deposited into a collection
  MOMENT_DEPOSIT: 'AllDay.Deposit',
  // When a moment is withdrawn from a collection  
  MOMENT_WITHDRAW: 'AllDay.Withdraw',
  // When a moment is purchased on marketplace
  MOMENT_PURCHASED: 'Market.MomentPurchased',
  // When a pack is purchased
  PACK_PURCHASED: 'PackNFT.PackPurchased',
  // When DUC tokens are withdrawn (payment)
  DUC_WITHDRAWN: 'DapperUtilityCoin.TokensWithdrawn',
};

// Scan for moment acquisition events
export async function scanMomentAcquisition(
  walletAddress: string,
  momentId: string,
  startBlock?: number
): Promise<{
  acquisitionType: 'purchase' | 'gift' | 'pack' | 'unknown',
  price?: number,
  date?: string,
  seller?: string,
  transactionId?: string
}> {
  try {
    // Get current block height
    const latestBlock = await fcl.send([
      fcl.getBlock(true)
    ]).then(fcl.decode);

    // Scan last ~6 months of blocks if no start specified
    const scanStartBlock = startBlock || (latestBlock.height - 4320000); // ~30 days per 1M blocks
    
    // Query deposit events for this wallet
    const depositEvents = await fcl.send([
      fcl.getEventsAtBlockHeightRange(
        `A.e4cf4bdc1751c65d.AllDay.Deposit`,
        scanStartBlock,
        latestBlock.height
      )
    ]).then(fcl.decode);

    // Filter for our specific moment and wallet
    const relevantDeposits = depositEvents.filter((event: any) => {
      const eventData = event.data;
      return eventData.to === walletAddress && eventData.id === momentId;
    });

    if (relevantDeposits.length === 0) {
      return { acquisitionType: 'unknown' };
    }

    // Get the deposit transaction
    const depositTx = relevantDeposits[0];
    const txId = depositTx.transactionId;

    // Check if this transaction also has a payment event
    const transaction = await fcl.send([
      fcl.getTransaction(txId)
    ]).then(fcl.decode);

    // Look for payment events in same transaction
    const hasPayment = transaction.events.some((event: any) => 
      event.type.includes('TokensWithdrawn') || 
      event.type.includes('MomentPurchased')
    );

    if (hasPayment) {
      // Extract price from MomentPurchased event
      const purchaseEvent = transaction.events.find((e: any) => 
        e.type.includes('MomentPurchased')
      );
      
      return {
        acquisitionType: 'purchase',
        price: purchaseEvent?.data?.price || 0,
        date: depositTx.blockTimestamp,
        seller: purchaseEvent?.data?.seller,
        transactionId: txId
      };
    }

    // Check if from pack
    const fromPack = transaction.events.some((event: any) => 
      event.type.includes('PackOpened')
    );

    if (fromPack) {
      return {
        acquisitionType: 'pack',
        date: depositTx.blockTimestamp,
        transactionId: txId
      };
    }

    // Otherwise it's a gift/transfer
    return {
      acquisitionType: 'gift',
      date: depositTx.blockTimestamp,
      transactionId: txId,
      seller: depositTx.data.from
    };

  } catch (error) {
    console.error('Error scanning blockchain:', error);
    return { acquisitionType: 'unknown' };
  }
}

// Batch scan multiple moments
export async function batchScanMoments(
  walletAddress: string,
  momentIds: string[]
): Promise<Map<string, any>> {
  const results = new Map();
  
  // In production, optimize with parallel queries
  for (const momentId of momentIds) {
    const acquisition = await scanMomentAcquisition(walletAddress, momentId);
    results.set(momentId, acquisition);
  }
  
  return results;
}