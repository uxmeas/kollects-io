import { NextResponse } from 'next/server';
import { getNFLAllDayService } from '@/lib/flow/nfl-allday-service';
import { getAllDayMoments } from '@/lib/flow/nfl-allday-cadence';
import { getBestAvailablePrice } from '@/lib/nflallday/alternative-apis';


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

    // Validate address format - Flow addresses can have varying lengths
    if (!address.match(/^0x[a-fA-F0-9]+$/)) {
      return NextResponse.json(
        { error: 'Invalid Flow address format' },
        { status: 400 }
      );
    }

    console.log('Fetching NFL All Day collection for address:', address);
    
    // Initialize the NFL All Day service with available API keys
    const service = getNFLAllDayService({
      bitqueryApiKey: process.env.BITQUERY_API_KEY,
      flipsideApiKey: process.env.FLIPSIDE_API_KEY,
      quicknodeEndpoint: process.env.QUICKNODE_ENDPOINT,
    });
    
    try {
      // Try the comprehensive service first
      const moments = await service.getCollectionWithHistory(address);
      
      if (moments && moments.length > 0) {
        // Merge with any manual user data
        moments.forEach(moment => {
          const userPurchaseData = userData[moment.id];
          if (userPurchaseData && !moment.purchasePrice) {
            moment.purchasePrice = userPurchaseData.purchasePrice;
            moment.purchaseDate = userPurchaseData.purchaseDate;
          }
        });
        
        // Calculate totals
        const totalPurchasePrice = moments.reduce(
          (sum, m) => sum + (m.purchasePrice || 0),
          0
        );
        const totalMarketValue = moments.reduce(
          (sum, m) => sum + (m.currentPrice || 0),
          0
        );
        const profitLoss = totalMarketValue - totalPurchasePrice;
        
        return NextResponse.json({
          address,
          moments,
          totalCount: moments.length,
          detailedCount: moments.length,
          totalPurchasePrice,
          totalMarketValue,
          profitLoss,
          timestamp: new Date().toISOString(),
          dataSource: 'flow-blockchain',
        });
      }
    } catch (serviceError) {
      console.error('Service error, falling back to direct blockchain query:', serviceError);
    }
    
    // Fallback to direct blockchain query
    const rawMoments = await getAllDayMoments(address);
    
    if (!rawMoments || rawMoments.length === 0) {
      return NextResponse.json({
        address,
        moments: [],
        totalCount: 0,
        detailedCount: 0,
        totalPurchasePrice: 0,
        totalMarketValue: 0,
        profitLoss: 0,
        timestamp: new Date().toISOString(),
        error: 'No NFL All Day moments found. Make sure the wallet has NFL All Day collection initialized.',
        helpText: 'If you own NFL All Day moments, try visiting nflallday.com to ensure your collection is properly initialized.',
      });
    }
    
    // Process raw moments with enhanced data
    const processedMoments = await Promise.all(
      rawMoments.slice(0, 20).map(async (moment: any) => {
        // Get user's purchase data if available
        const userPurchaseData = userData[moment.id];
        
        // Try to get real market price
        let marketPrice = null;
        let priceSource = null;
        
        try {
          const priceData = await getBestAvailablePrice(moment.id);
          if (priceData.price) {
            marketPrice = priceData.price;
            priceSource = priceData.source;
          }
        } catch (error) {
          console.log('Could not fetch price for moment', moment.id);
        }
        
        return {
          id: moment.id,
          playID: moment.play?.id || moment.playID,
          editionID: moment.editionID,
          serialNumber: moment.serialNumber,
          mintingDate: moment.mintingDate,
          player: {
            name: moment.play?.metadata?.playerName || 'Unknown Player',
            position: moment.play?.metadata?.playerPosition,
            team: moment.play?.metadata?.teamName,
          },
          playType: moment.play?.metadata?.playType,
          description: moment.play?.description,
          series: moment.series?.name,
          imageUrl: `https://media.nflallday.com/editions/${moment.editionID}/play_${moment.play?.id}_capture_Hero_Black_2880_2880.png`,
          videoUrl: `https://media.nflallday.com/editions/${moment.editionID}/play_${moment.play?.id}_capture_Hero_Black_2880_2880_Animated.mp4`,
          alldayUrl: `https://nflallday.com/listing/moment/${moment.id}`,
          purchasePrice: userPurchaseData?.purchasePrice || null,
          marketPrice: marketPrice,
          currentPrice: marketPrice,
          purchaseDate: userPurchaseData?.purchaseDate || null,
          notes: userPurchaseData?.notes || (priceSource ? `Price from ${priceSource}` : null),
          transactionId: userPurchaseData?.transactionId || null,
          isUserData: !!userPurchaseData
        };
      })
    );
    
    // Include remaining moments as minimal data
    const remainingMoments = rawMoments.slice(20).map((moment: any) => ({
      id: moment.id,
      serialNumber: moment.serialNumber,
      player: {
        name: moment.play?.metadata?.playerName || 'Unknown Player',
      }
    }));
    
    // Calculate totals
    const totalPurchasePrice = processedMoments
      .filter((m: any) => m.purchasePrice !== null)
      .reduce((sum: number, m: any) => sum + (m.purchasePrice || 0), 0);
    const totalMarketValue = processedMoments
      .filter((m: any) => m.purchasePrice !== null)
      .reduce((sum: number, m: any) => sum + (m.marketPrice || 0), 0);
    const profitLoss = totalMarketValue - totalPurchasePrice;
    
    return NextResponse.json({
      address,
      moments: [...processedMoments, ...remainingMoments],
      totalCount: rawMoments.length,
      detailedCount: processedMoments.length,
      totalPurchasePrice,
      totalMarketValue,
      profitLoss,
      timestamp: new Date().toISOString(),
      dataSource: 'flow-direct',
      note: 'Purchase history requires API keys for Flipside or Bitquery. Add manual purchase data via the UI.',
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