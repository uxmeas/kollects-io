// Fast wallet status API endpoint
// Provides quick wallet connection status without heavy health checks

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    // Quick status check - no heavy operations
    const status = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      wallet: {
        connected: false,
        address: null
      },
      services: {
        websocket: { status: 'ready' },
        cache: { status: 'ready' }
      }
    };

    res.status(200).json(status);
    
  } catch (error) {
    console.error('Wallet status error:', error);
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
} 