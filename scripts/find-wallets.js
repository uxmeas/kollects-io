// Quick script to test some known NFL All Day wallets
const axios = require('axios');

const KNOWN_WALLETS = [
  // These are some addresses that might have NFL All Day moments
  "0x29fcd0b5e444242a", // Known collector
  "0x9c85e2413d4f851e", // Active wallet
  "0xf3fcd2e83b12a91f", // Test wallet
  "0xe03daebed8ca0615", // Marketplace wallet
  "0xc2ad88c80dbd0309", // Another test
];

async function testWallet(address) {
  try {
    const response = await axios.get(`http://localhost:3000/api/wallet/${address}`);
    const data = response.data;
    
    if (data.count > 0) {
      console.log(`✅ ${address}: ${data.count} moments found!`);
      return true;
    } else {
      console.log(`❌ ${address}: No moments`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${address}: Error - ${error.message}`);
    return false;
  }
}

async function findActiveWallets() {
  console.log('Testing known NFL All Day wallets...\n');
  
  for (const wallet of KNOWN_WALLETS) {
    await testWallet(wallet);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Run the test
findActiveWallets();