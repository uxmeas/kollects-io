import * as fcl from "@onflow/fcl";

// Configure FCL for mainnet
fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "app.detail.title": "Kollects.io",
  "app.detail.icon": "https://kollects.io/logo.png"
});

// NFL All Day Contract Addresses
export const NFL_CONTRACTS = {
  AllDay: "0xe4cf4bdc1751c65d",
  PackNFT: "0xe4cf4bdc1751c65d",
  MarketPlace: "0xe4cf4bdc1751c65d"
} as const;

// Validate Flow address format
export function isValidFlowAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{16}$/.test(address);
}
