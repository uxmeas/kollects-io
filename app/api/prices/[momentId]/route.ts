import { NextResponse } from 'next/server';

// Proxy endpoint to handle CORS for price data
export async function GET(
  request: Request,
  { params }: { params: { momentId: string } }
) {
  try {
    const { momentId } = params;
    
    // Try Flowty first
    try {
      const flowtyResponse = await fetch(
        `https://www.flowty.io/api/v1/collection/0xe4cf4bdc1751c65d/AllDay/listings?tokenId=${momentId}`,
        {
          headers: {
            'User-Agent': 'Kollects.io/1.0',
            'Accept': 'application/json',
          }
        }
      );
      
      if (flowtyResponse.ok) {
        const data = await flowtyResponse.json();
        const listings = data.listings || [];
        if (listings.length > 0) {
          const prices = listings.map((l: any) => l.price).filter((p: number) => p > 0);
          const lowestPrice = Math.min(...prices);
          return NextResponse.json({
            price: lowestPrice,
            source: 'Flowty',
            currency: 'USD'
          });
        }
      }
    } catch (error) {
      console.log('Flowty API error:', error);
    }
    
    // Try Flowverse as fallback
    try {
      const flowverseResponse = await fetch(
        `https://nft.flowverse.co/api/marketplace/AllDay/${momentId}`,
        {
          headers: {
            'User-Agent': 'Kollects.io/1.0',
            'Accept': 'application/json',
          }
        }
      );
      
      if (flowverseResponse.ok) {
        const data = await flowverseResponse.json();
        if (data.lowestPrice) {
          return NextResponse.json({
            price: data.lowestPrice,
            source: 'Flowverse',
            currency: 'USD'
          });
        }
      }
    } catch (error) {
      console.log('Flowverse API error:', error);
    }
    
    // No price found
    return NextResponse.json({
      price: null,
      source: 'none',
      message: 'No listings found'
    });
    
  } catch (error: any) {
    console.error('Price API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch price data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}