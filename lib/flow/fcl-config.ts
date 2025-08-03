import * as fcl from '@onflow/fcl';

// Configure FCL for mainnet with Dapper Wallet only
export const configureFCL = () => {
  fcl.config({
    'app.detail.title': 'Kollects.io',
    'app.detail.icon': 'https://kollects.io/icon.png',
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'flow.network': 'mainnet',
    // Direct Dapper Wallet configuration
    'discovery.wallet': 'https://accounts.meetdapper.com/fcl/authn',
    'discovery.wallet.method': 'IFRAME/RPC',
    'service.OpenID.scopes': 'email',
  });
};

// Initialize FCL configuration
if (typeof window !== 'undefined') {
  configureFCL();
}