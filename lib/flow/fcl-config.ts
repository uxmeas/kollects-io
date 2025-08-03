import * as fcl from '@onflow/fcl';

// Configure FCL for mainnet with wallet discovery
export const configureFCL = () => {
  fcl.config({
    'app.detail.title': 'Kollects.io',
    'app.detail.icon': 'https://kollects.io/icon.png',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
    'flow.network': 'mainnet',
    // Include wallets
    'discovery.authn.include': [
      '0x82ec283f88a62e65', // Dapper Wallet
      '0xd2aaaa60e9cafb7f', // Blocto
      '0x9d2e44203cb13051', // Lilico
    ],
  });
};

// Initialize FCL configuration
if (typeof window !== 'undefined') {
  configureFCL();
}