# Kollects.io

A comprehensive portfolio tracker for NFL All Day NFT collections on the Flow blockchain. Track your investment performance with real purchase history and current market prices.

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

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure API keys for enhanced features (optional but recommended):
- **Bitquery API**: For blockchain transaction history
- **Flipside Crypto API**: For indexed NFL All Day data  
- **QuickNode**: For real-time event streaming

Without API keys, the app will still work but purchase history must be entered manually.

## 📱 Features

- **Direct Flow Blockchain Integration**: Query NFL All Day moments using Cadence scripts
- **Purchase History Tracking**: Automatic detection via blockchain indexers or manual entry
- **Real-time Market Prices**: Current prices from multiple marketplaces
- **Portfolio Analytics**: Track profit/loss, ROI, and investment performance
- **Transaction History**: View complete history of purchases, transfers, and pack openings
- **Export Data**: Download your portfolio data as CSV
- **Mobile-responsive Design**: Works seamlessly on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Blockchain**: Flow Blockchain, FCL (Flow Client Library), Cadence
- **Data Sources**: 
  - Direct Flow blockchain queries
  - Bitquery GraphQL API
  - Flipside Crypto SQL queries
  - QuickNode real-time streams
- **State Management**: React Query, localStorage for user data

## 🔗 Data Architecture

### Primary Data Source: Flow Blockchain
The app queries NFL All Day smart contracts directly using Cadence scripts:
- Contract Address: `0xe4cf4bdc1751c65d`
- Collection Path: `/public/AllDayNFTCollection`

### Purchase History Sources
1. **Blockchain Indexers** (requires API keys):
   - Flipside Crypto: Comprehensive SQL-based queries
   - Bitquery: GraphQL API for Flow transactions
   - QuickNode: Real-time event streaming

2. **Manual Entry**: Users can add purchase data via the UI
   - Data stored in browser localStorage
   - Persists across sessions

### Market Price Sources
- Flowty marketplace API
- Flowverse marketplace API  
- Alternative price aggregators

## 🚀 Advanced Usage

### Using the NFL All Day Service
```typescript
import { getNFLAllDayService } from '@/lib/flow/nfl-allday-service';

const service = getNFLAllDayService({
  bitqueryApiKey: process.env.BITQUERY_API_KEY,
  flipsideApiKey: process.env.FLIPSIDE_API_KEY,
});

const collection = await service.getCollectionWithHistory(walletAddress);
```

### Direct Cadence Queries
```typescript
import { getAllDayMoments } from '@/lib/flow/nfl-allday-cadence';

const moments = await getAllDayMoments(walletAddress);
```

## 📄 License

MIT
