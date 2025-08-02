#!/bin/bash

echo "🚀 Setting up Kollects.io project..."

# Create Next.js app with TypeScript and Tailwind
echo "📦 Creating Next.js app..."
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Install Flow dependencies
echo "🔗 Installing Flow blockchain dependencies..."
npm install @onflow/fcl @onflow/types

# Install additional dependencies
echo "📚 Installing additional packages..."
npm install axios react-query @tanstack/react-query

# Create project structure
echo "📁 Creating project structure..."
mkdir -p app/api/wallet
mkdir -p app/collection
mkdir -p components
mkdir -p lib/flow
mkdir -p lib/api
mkdir -p types
mkdir -p public/images

# Create basic Flow configuration
cat > lib/flow/config.ts << 'EOF'
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
EOF

# Create environment variables file
cat > .env.local << 'EOF'
# Flow Blockchain Configuration
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org
NEXT_PUBLIC_FLOW_NETWORK=mainnet

# API Keys (if needed in future)
# NEXT_PUBLIC_API_KEY=your_api_key_here
EOF

# Update README
cat > README.md << 'EOF'
# Kollects.io

A web application for tracking NFL All Day NFT collections on the Flow blockchain.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔧 Environment Setup

Copy `.env.local.example` to `.env.local` and configure if needed.

## 📱 Features

- View any Flow wallet's NFL All Day collection
- Real-time market data
- Collection analytics
- Mobile-responsive design

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Flow Blockchain
- React Query

## 📄 License

MIT
EOF

# Create basic homepage
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-8">
          Kollects.io
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Track your NFL All Day collection on the Flow blockchain
        </p>
        
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Enter Flow wallet address (0x...)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full mt-4 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition">
            View Collection
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          For entertainment and tracking purposes only. Not financial advice.
        </div>
      </div>
    </main>
  );
}
EOF

echo "✅ Project setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd /Users/pheakmeas/Documents/Development/Personal-Projects/kollects-io"
echo "2. npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "🎯 Start implementing:"
echo "- Flow wallet integration in lib/flow/"
echo "- API routes in app/api/wallet/"
echo "- Collection display in app/collection/"