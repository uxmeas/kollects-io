import { NextResponse } from 'next/server';
import * as fcl from '@onflow/fcl';
import { GET_NFL_MOMENTS, GET_MOMENT_METADATA } from '@/lib/flow/scripts';
import { getPlayData, generatePlaceholderPlayData, getAllDayUrl, generatePurchasePrice, generateMarketPrice, generatePurchaseDate } from '@/lib/flow/nfl-data';
import { getLowestPrice, getMomentMetadata } from '@/lib/nflallday/api';

// Configure FCL
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "flow.network": "mainnet"
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  // Get user data from query params (passed from client localStorage)
  const url = new URL(request.url);
  const userDataParam = url.searchParams.get('userData');
  const userData = userDataParam ? JSON.parse(userDataParam) : {};
  try {
    const { address } = params;

    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{16}$/)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      );
    }

    console.log('Fetching moments for address:', address);

    // Fetch moment IDs
    const momentIDs = await fcl.query({
      cadence: GET_NFL_MOMENTS,
      args: (arg: any, t: any) => [arg(address, t.Address)]
    });

    console.log('Found moment IDs:', momentIDs);

    // For first 20 moments, get detailed data
    const momentsToFetch = (momentIDs || []).slice(0, 20);
    
    // For now, we'll use the blockchain data we have and enhance it
    const momentsWithData = await Promise.all(
      momentsToFetch.map(async (momentId: string, index: number) => {
        const userMomentData = userData[momentId];
        
        // Try to get real serial number and metadata from blockchain
        let serialNumber = String((parseInt(momentId) % 10000) + 1);
        let playID = String((parseInt(momentId) % 1000) + 1);
        
        try {
          // Query blockchain for real moment data
          const momentData = await fcl.query({
            cadence: GET_MOMENT_METADATA,
            args: (arg: any, t: any) => [
              arg(address, t.Address),
              arg(momentId, t.UInt64)
            ]
          });
          
          if (momentData) {
            serialNumber = momentData.serialNumber || serialNumber;
            playID = momentData.playID || playID;
          }
        } catch (error) {
          console.log('Could not fetch moment metadata for', momentId);
        }
        
        // Get play data
        const playData = getPlayData(playID) || generatePlaceholderPlayData(playID);
        
        // For market price, we'll show a message that real-time prices require API access
        const marketPrice = null; // Will show as "-" in UI
        
        return {
          id: momentId,
          playID,
          serialNumber,
          player: playData.player,
          playType: playData.playType,
          description: playData.description,
          series: playData.series,
          alldayUrl: getAllDayUrl(momentId),
          imageUrl: `https://assets.nflallday.com/resize/editions/series_${playData.series?.split(' ')[1] || '1'}/play_${playID}_capture_Hero_Black_2880_2880_Black.png?width=512`,
          purchasePrice: userMomentData?.purchasePrice || null,
          marketPrice: marketPrice,
          purchaseDate: userMomentData?.purchaseDate || null,
          notes: userMomentData?.notes || (marketPrice === null ? "Real-time prices require NFL All Day API access" : null),
          transactionId: userMomentData?.transactionId || null,
          isUserData: !!userMomentData
        };
      })
    );

    // Include remaining moments as just IDs
    const remainingMoments = (momentIDs || []).slice(20).map((id: string) => ({ id }));

    // Calculate totals (only for moments with user data)
    const totalPurchasePrice = momentsWithData
      .filter((m: any) => m.purchasePrice !== null)
      .reduce((sum: number, m: any) => sum + (m.purchasePrice || 0), 0);
    const totalMarketValue = momentsWithData
      .filter((m: any) => m.purchasePrice !== null)
      .reduce((sum: number, m: any) => sum + (m.marketPrice || 0), 0);

    return NextResponse.json({
      address,
      moments: [...momentsWithData, ...remainingMoments],
      totalCount: (momentIDs || []).length,
      detailedCount: momentsWithData.length,
      totalPurchasePrice,
      totalMarketValue,
      profitLoss: totalMarketValue - totalPurchasePrice,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch wallet data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}