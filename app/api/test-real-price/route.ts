import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Let's test with NBA Top Shot first (similar to NFL All Day)
    // This is a known working example
    const testMomentId = "208914631"; // Example NBA Top Shot moment
    
    // NBA Top Shot has a public API we can test
    const response = await fetch(
      `https://api.nba.dapperlabs.com/marketplace/graphql`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetMoment($momentId: ID!) {
              getMintedMoment(momentId: $momentId) {
                data {
                  id
                  play {
                    stats {
                      playerName
                      teamAtMoment
                    }
                  }
                }
                lowestAsk
              }
            }
          `,
          variables: { momentId: testMomentId }
        })
      }
    );
    
    const data = await response.json();
    
    // For NFL All Day, we need to find their specific API endpoint
    // Let's try a few approaches:
    
    // Approach 1: Check if they have a similar GraphQL endpoint
    const nflEndpoints = [
      'https://api.nflallday.com/marketplace/graphql',
      'https://nflallday.com/api/graphql',
      'https://api.nfl.dapperlabs.com/marketplace/graphql'
    ];
    
    const nflResults = await Promise.all(
      nflEndpoints.map(async (endpoint) => {
        try {
          const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `{ __typename }`
            })
          });
          return { endpoint, status: resp.status };
        } catch (e) {
          return { endpoint, status: 'error' };
        }
      })
    );
    
    return NextResponse.json({
      nbaTopShotTest: {
        worked: !!data?.data,
        lowestAsk: data?.data?.getMintedMoment?.lowestAsk,
        player: data?.data?.getMintedMoment?.data?.play?.stats?.playerName
      },
      nflAllDayEndpoints: nflResults,
      suggestion: "NBA Top Shot API works. Need to find NFL All Day's specific endpoint."
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}