# 🚀 Kollects.io Quick Start Guide

## Setup Instructions

1. **Navigate to project**:
   ```bash
   cd /Users/pheakmeas/Documents/Development/Personal-Projects/kollects-io
   ```

2. **Run setup script**:
   ```bash
   ./setup-project.sh
   ```
   This will:
   - Create a Next.js app with TypeScript
   - Install Flow blockchain dependencies
   - Set up project structure
   - Create basic configuration files

3. **Start development**:
   ```bash
   npm run dev
   ```

4. **Open browser**:
   http://localhost:3000

## 📁 Project Structure

```
kollects-io/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── wallet/        # Wallet data endpoints
│   ├── collection/        # Collection view pages
│   └── page.tsx          # Homepage
├── components/            # React components
├── lib/                   # Core libraries
│   ├── flow/             # Flow blockchain integration
│   │   ├── config.ts     # FCL configuration
│   │   ├── scripts.ts    # Cadence scripts
│   │   └── nfl-allday.ts # NFL All Day specific logic
│   └── api/              # API utilities
├── public/               # Static assets
└── types/                # TypeScript types
```

## 🔧 Key Files Created

1. **lib/flow/config.ts** - Flow blockchain configuration
2. **lib/flow/scripts.ts** - Cadence scripts for querying NFTs
3. **lib/flow/nfl-allday.ts** - NFL All Day integration logic
4. **PROJECT_PLAN.md** - Development roadmap
5. **.env.local** - Environment variables

## 📝 Next Steps

### 1. Create API Route (app/api/wallet/[address]/route.ts):
```typescript
import { NextResponse } from 'next/server';
import { fetchWalletCollection } from '@/lib/flow/nfl-allday';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const moments = await fetchWalletCollection(params.address);
    return NextResponse.json({ 
      address: params.address,
      moments,
      count: moments.length 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}
```

### 2. Create Collection Page (app/collection/[address]/page.tsx):
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CollectionPage() {
  const params = useParams();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wallet/${params.address}`)
      .then(res => res.json())
      .then(data => {
        setMoments(data.moments);
        setLoading(false);
      });
  }, [params.address]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1>NFL All Day Collection</h1>
      <p>Found {moments.length} moments</p>
      {/* Add moment display grid here */}
    </div>
  );
}
```

### 3. Test with a real wallet:
- Example address: `0xe4cf4bdc1751c65d` (NFL All Day contract)
- Or any wallet that owns NFL All Day moments

## 🎯 MVP Checklist

- [ ] Basic UI with address input
- [ ] Connect to Flow blockchain
- [ ] Fetch moment IDs from wallet
- [ ] Display moment metadata
- [ ] Add loading states
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] Compliance disclaimer

## 🐛 Troubleshooting

1. **FCL not connecting**: Check Flow access node is accessible
2. **No moments found**: Ensure wallet has NFL All Day NFTs
3. **Rate limiting**: Add delays between batch requests

## 📚 Resources

- Flow Docs: https://developers.flow.com/
- FCL Reference: https://developers.flow.com/fcl/reference/api
- NFL All Day Contracts: https://flowscan.org/contract/A.e4cf4bdc1751c65d.AllDay