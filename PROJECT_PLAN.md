# Kollects.io - NFL All Day Collection Tracker

## 🎯 Project Overview

A web application that allows users to view and track their NFL All Day NFT collections on the Flow blockchain, with real-time market data and portfolio analytics.

## 🏗️ Technical Stack

- **Frontend**: Next.js 14 (App Router)
- **Blockchain**: Flow blockchain integration
- **Styling**: Tailwind CSS
- **Data**: Flow REST API for blockchain queries
- **Deployment**: Vercel

## 📋 MVP Features (Week 1-2)

### Phase 1: Basic Setup & Flow Connection
- [ ] Next.js project setup with TypeScript
- [ ] Flow blockchain connection (read-only)
- [ ] Address input to view any wallet
- [ ] Fetch NFL All Day moment IDs
- [ ] Display moment count

### Phase 2: Moment Details
- [ ] Fetch moment metadata (player, team, play)
- [ ] Display moments in grid layout
- [ ] Basic responsive design
- [ ] Loading states

### Phase 3: Market Data (Week 2)
- [ ] Integrate marketplace pricing
- [ ] Show floor prices
- [ ] Calculate collection value
- [ ] Add caching layer

## 🚀 Future Enhancements

- NBA Top Shot support
- Other Flow NFT collections
- Portfolio analytics
- Price alerts
- Multi-wallet tracking

## 📝 Development Guidelines

1. **Start Simple**: No wallet connection required initially
2. **Read-Only**: Focus on viewing data first
3. **Compliance**: Include proper disclaimers
4. **Performance**: Cache blockchain queries
5. **Mobile-First**: Responsive design priority

## 🔗 Resources

- Flow Docs: https://developers.flow.com/
- NFL All Day Contracts: 0xe4cf4bdc1751c65d
- Flow REST API: https://rest-mainnet.onflow.org