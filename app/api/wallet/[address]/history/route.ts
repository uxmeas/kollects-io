import { NextResponse } from 'next/server';
import * as fcl from '@onflow/fcl';

// Configure FCL
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "flow.network": "mainnet"
});

// NFL All Day Marketplace contract
const MARKETPLACE_ADDRESS = "0xb8ea91944fd8f439";
const ALLDAY_ADDRESS = "0xe4cf4bdc1751c65d";
const DUC_ADDRESS = "0xead892083b3e2c6c"; // Dapper Utility Coin

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const url = new URL(request.url);
    const momentId = url.searchParams.get('momentId');

    // Event types to scan
    const events = [
      `A.${ALLDAY_ADDRESS}.AllDay.Deposit`,
      `A.${ALLDAY_ADDRESS}.AllDay.Withdraw`,
      `A.${MARKETPLACE_ADDRESS}.Market.MomentPurchased`,
      `A.${DUC_ADDRESS}.DapperUtilityCoin.TokensWithdrawn`
    ];

    // In production, you'd scan events like this:
    // const latestBlock = await fcl.send([fcl.getBlock(true)]).then(fcl.decode);
    // const startBlock = latestBlock.height - 100000; // Last ~100k blocks
    
    // For each event type, scan the blockchain
    // const depositEvents = await fcl.send([
    //   fcl.getEventsAtBlockHeightRange(
    //     events[0],
    //     startBlock,
    //     latestBlock.height
    //   )
    // ]).then(fcl.decode);

    // Process events to find:
    // 1. Deposits to this wallet
    // 2. Check if there was a payment (DUC withdrawal) at same time
    // 3. If payment exists -> purchase with price
    // 4. If no payment -> gift/pack/transfer

    // Mock response for now
    const mockHistory = {
      address,
      momentId,
      transactions: [
        {
          type: "purchase",
          transactionId: "abc123",
          momentId: momentId,
          from: "0xmarketplace",
          to: address,
          price: 125.00,
          currency: "DUC",
          timestamp: "2023-06-15T10:30:00Z",
          blockHeight: 12345678,
          eventType: "MarketplacePurchase"
        },
        {
          type: "gift",
          transactionId: "def456",
          momentId: "789",
          from: "0xfriend",
          to: address,
          price: null,
          currency: null,
          timestamp: "2023-07-20T15:45:00Z",
          blockHeight: 12346789,
          eventType: "DirectTransfer"
        }
      ],
      summary: {
        totalPurchases: 1,
        totalGifts: 1,
        totalSpent: 125.00
      }
    };

    return NextResponse.json(mockHistory);

  } catch (error: any) {
    console.error('History API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction history', details: error.message },
      { status: 500 }
    );
  }
}