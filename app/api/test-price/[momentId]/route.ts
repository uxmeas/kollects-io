import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { momentId: string } }
) {
  const { momentId } = params;
  
  try {
    // Test 1: Try NFL All Day direct API
    console.log('Testing NFL All Day API for moment:', momentId);
    
    // Try to get moment data from their public endpoint
    const nflResponse = await fetch(`https://nflallday.com/listing/moment/${momentId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('NFL Response status:', nflResponse.status);
    
    // Test 2: Try a different approach - check their marketplace listings
    const marketplaceUrl = `https://nflallday.com/marketplace/moments/${momentId}`;
    const marketResponse = await fetch(marketplaceUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    console.log('Marketplace Response status:', marketResponse.status);
    
    // Test 3: Try to scrape the page data (as a last resort)
    const pageResponse = await fetch(`https://nflallday.com/listing/moment/${momentId}`, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    const pageText = await pageResponse.text();
    
    // Look for price data in the HTML
    const priceMatch = pageText.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const lowestPrice = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
    
    // Look for player name
    const playerMatch = pageText.match(/<meta property="og:title" content="([^"]+)"/);
    const playerInfo = playerMatch ? playerMatch[1] : null;
    
    return NextResponse.json({
      momentId,
      scrapedPrice: lowestPrice,
      playerInfo,
      nflApiStatus: nflResponse.status,
      marketApiStatus: marketResponse.status,
      message: 'Testing different approaches to get real data'
    });
    
  } catch (error: any) {
    console.error('Test API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch price data',
      details: error.message,
      momentId
    }, { status: 500 });
  }
}