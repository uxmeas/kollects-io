import { NextResponse } from 'next/server';
import { getMomentMetadata } from '@/lib/flow/purchase-history';
import { getAccountTransactions, searchAllDayEvents } from '@/lib/flow/graffle-api';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const url = new URL(request.url);
    const momentIds = url.searchParams.get('momentIds')?.split(',') || [];
    
    // Try multiple data sources
    const purchaseData: any[] = [];
    
    // Method 1: Try to get from blockchain metadata
    for (const momentId of momentIds) {
      try {
        const metadata = await getMomentMetadata(address, momentId);
        if (metadata) {
          purchaseData.push({
            momentId,
            mintingDate: metadata.mintingDate,
            serialNumber: metadata.serialNumber,
            editionID: metadata.editionID,
            source: 'blockchain'
          });
        }
      } catch (error) {
        console.log(`No blockchain data for moment ${momentId}`);
      }
    }
    
    // Method 2: Try Graffle API for transaction history
    try {
      const events = await searchAllDayEvents(address);
      if (events && events.length > 0) {
        // Parse events for purchase data
        for (const event of events) {
          if (event.type?.includes('Deposit') && momentIds.includes(event.data?.id)) {
            purchaseData.push({
              momentId: event.data.id,
              timestamp: event.timestamp,
              transactionId: event.transactionId,
              source: 'graffle'
            });
          }
        }
      }
    } catch (error) {
      console.log('Graffle API not available');
    }
    
    // Method 3: Check localStorage/client data (to be implemented)
    // Users could manually input their purchase data
    
    // Method 4: Scrape from NFL All Day website (if logged in)
    // This would require user authentication
    
    // For development: Add some mock data to show the concept
    if (purchaseData.length === 0 && process.env.NODE_ENV === 'development') {
      const mockPrices = [45, 125, 89, 234, 67, 156, 299, 78, 445, 93];
      const mockDates = [
        '2023-09-15', '2023-10-22', '2023-11-08', '2023-12-01',
        '2024-01-14', '2024-02-28', '2024-03-17', '2024-04-05'
      ];
      
      for (let i = 0; i < Math.min(momentIds.length, 3); i++) {
        purchaseData.push({
          momentId: momentIds[i],
          purchasePrice: mockPrices[i % mockPrices.length],
          purchaseDate: mockDates[i % mockDates.length],
          source: 'mock',
          note: 'Development data - implement real data source'
        });
      }
    }
    
    return NextResponse.json({
      address,
      purchaseHistory: purchaseData,
      dataSource: purchaseData.length > 0 ? purchaseData[0].source : 'none',
      message: purchaseData.length === 0 ? 
        'No purchase history found. Manual entry or blockchain indexer required.' : 
        'Purchase history retrieved'
    });
    
  } catch (error: any) {
    console.error('Purchase history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase history', details: error.message },
      { status: 500 }
    );
  }
}