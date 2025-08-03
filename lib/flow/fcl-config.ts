import * as fcl from '@onflow/fcl';

// Configure FCL for mainnet with wallet discovery
export const configureFCL = () => {
  fcl.config({
    'app.detail.title': 'Kollects.io',
    'app.detail.icon': 'https://kollects.io/icon.png',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'flow.network': 'mainnet',
    'discovery.wallet': 'https://fcl-discovery.onflow.org/authn',
    'discovery.authn.endpoint': 'https://fcl-discovery.onflow.org/api/authn',
    // Limit to Dapper wallet only
    'discovery.authn.include': ['0x82ec283f88a62e65'], // Dapper Wallet address
  });
};

// Initialize FCL configuration
if (typeof window !== 'undefined') {
  configureFCL();
}