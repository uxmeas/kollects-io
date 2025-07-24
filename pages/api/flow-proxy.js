// Vercel serverless function to solve CORS restrictions
// Proxies requests to QuickNode Flow endpoint for real NBA Top Shot data

const QUICKNODE_FLOW_ENDPOINT = 'https://radial-maximum-snowflake.flow-mainnet.quiknode.pro/54979bcefb63d671f5f5d1be5e5311c967e799c2/v1/scripts';

// Mock data detection patterns
const MOCK_DATA_PATTERNS = [
  // Removed all specific test moment IDs for nuclear cleanup
  '', '', // Mock player names
  '', '', // Mock team names
  '', // Mock play descriptions
  '', // Mock dates
  '', // Mock set names
  '' // Mock set names
];

// Enhanced mock data detection function
function validateRealData(data, source = 'unknown') {
  const dataString = JSON.stringify(data);
  for (const pattern of MOCK_DATA_PATTERNS) {
    if (dataString.includes(pattern)) {
      console.error(`🚨 MOCK DATA DETECTED in ${source}:`, pattern);
      throw new Error(`🚨 MOCK DATA FORBIDDEN: ${pattern} found in ${source}`);
    }
  }
  return data;
}

// Environment enforcement
const STRICT_REAL_DATA_ONLY = process.env.NODE_ENV === 'production' || process.env.FORCE_REAL_DATA;

export default async function handler(req, res) {
  console.log('🔍 API PROXY CALLED WITH:', req.body);
  if (req.body && req.body.script) {
    const decodedScript = Buffer.from(req.body.script, 'base64').toString('utf-8');
    console.log('📝 DECODED SCRIPT BEING SENT:');
    console.log(decodedScript);
    console.log('---END SCRIPT---');
  }
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { script, arguments: args } = req.body;

    if (!script) {
      return res.status(400).json({ 
        error: 'Missing required field',
        message: 'Script is required'
      });
    }

    // Prepare the request payload for Flow
    const payload = {
      script: script, // Already base64 encoded from frontend
      arguments: args || []
    };

    console.log('📝 Payload for QuickNode:', JSON.stringify(payload, null, 2));

    console.log('🚀 Executing Flow script via QuickNode proxy...');
    console.log('📝 Script length:', script.length);
    console.log('🎯 Arguments:', args?.length || 0);

    console.log('🚀 Making real request to Flow blockchain via QuickNode...');
    
    // Make actual request to QuickNode Flow endpoint
    const response = await fetch(QUICKNODE_FLOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('❌ QuickNode API error:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'Flow blockchain connection failed',
        message: `QuickNode API returned ${response.status}: ${response.statusText}`,
        details: 'Check QuickNode endpoint configuration and API key'
      });
    }

    const data = await response.json();
    console.log('✅ Real Flow blockchain data received');
    console.log('📊 Response structure:', Object.keys(data));
    
    // Validate response for mock data
    if (STRICT_REAL_DATA_ONLY) {
      validateRealData(data, 'API response');
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ Flow proxy error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 