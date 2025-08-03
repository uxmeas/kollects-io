// NFL All Day Service - Main integration layer
// Combines direct blockchain access with third-party indexers

import { getAllDayMoments, parseMomentMetadata, getMarketplacePrice } from './nfl-allday-cadence';
import { getBitqueryTransactionData, scanMomentAcquisition } from './nfl-allday-indexer';
import { FlipsideCrypto } from './flipside-crypto';
import { QuickNodeStreams } from './quicknode-streams';

interface NFLAllDayMoment {
  id: string;
  playID: string;
  editionID: string;
  serialNumber: string;
  mintingDate: string;
  player: {
    name: string;
    position: string;
    team: string;
  };
  playType: string;
  description: string;
  series: string;
  imageUrl: string;
  videoUrl: string;
  purchasePrice?: number;
  purchaseDate?: string;
  currentPrice?: number;
  transactionHistory?: TransactionRecord[];
}

interface TransactionRecord {
  type: 'mint' | 'purchase' | 'transfer' | 'pack_open';
  date: string;
  price?: number;
  from: string;
  to: string;
  transactionId: string;
}

export class NFLAllDayService {
  private flipside?: FlipsideCrypto;
  private quicknode?: QuickNodeStreams;
  
  constructor(config?: {
    flipsideApiKey?: string;
    quicknodeEndpoint?: string;
    bitqueryApiKey?: string;
  }) {
    if (config?.flipsideApiKey) {
      this.flipside = new FlipsideCrypto(config.flipsideApiKey);
    }
    if (config?.quicknodeEndpoint) {
      this.quicknode = new QuickNodeStreams(config.quicknodeEndpoint);
    }
  }
  
  // Get complete collection with purchase history
  async getCollectionWithHistory(walletAddress: string): Promise<NFLAllDayMoment[]> {
    try {
      // 1. Get all moments from blockchain
      const rawMoments = await getAllDayMoments(walletAddress);
      if (!rawMoments || rawMoments.length === 0) {
        return [];
      }
      
      // 2. Parse and enhance moment data
      const moments: NFLAllDayMoment[] = rawMoments.map(raw => {
        const parsed = parseMomentMetadata(raw);
        return {
          ...parsed,
          videoUrl: `https://media.nflallday.com/editions/${parsed.editionID}/play_${parsed.playID}_capture_Hero_Black_2880_2880_Animated.mp4`,
        };
      });
      
      // 3. Try to get transaction history from Flipside Crypto
      if (this.flipside) {
        const flipsideData = await this.flipside.getNFLAllDayTransactions(walletAddress);
        // Merge Flipside data with moments
        this.mergeFlipsideData(moments, flipsideData);
      }
      
      // 4. Get purchase data from Bitquery if available
      const bitqueryData = await getBitqueryTransactionData(walletAddress);
      this.mergeBitqueryData(moments, bitqueryData);
      
      // 5. Get current market prices
      await this.fetchCurrentPrices(moments);
      
      // 6. Check localStorage for manual entries
      this.mergeLocalStorageData(moments, walletAddress);
      
      return moments;
    } catch (error) {
      console.error('Error getting NFL All Day collection:', error);
      throw error;
    }
  }
  
  // Get transaction history for a specific moment
  async getMomentTransactionHistory(momentId: string): Promise<TransactionRecord[]> {
    const transactions: TransactionRecord[] = [];
    
    // Try multiple sources
    if (this.flipside) {
      const flipsideHistory = await this.flipside.getMomentHistory(momentId);
      transactions.push(...flipsideHistory);
    }
    
    // Add more sources as needed
    
    return transactions;
  }
  
  // Subscribe to real-time events
  async subscribeToEvents(walletAddress: string, callback: (event: any) => void) {
    if (this.quicknode) {
      await this.quicknode.subscribeToNFLAllDayEvents(walletAddress, callback);
    } else {
      console.warn('QuickNode not configured for real-time events');
    }
  }
  
  // Private helper methods
  private mergeFlipsideData(moments: NFLAllDayMoment[], flipsideData: any[]) {
    flipsideData.forEach(transaction => {
      const moment = moments.find(m => m.id === transaction.nft_id);
      if (moment && transaction.event_type === 'purchase') {
        moment.purchasePrice = transaction.price;
        moment.purchaseDate = transaction.block_timestamp;
        
        if (!moment.transactionHistory) {
          moment.transactionHistory = [];
        }
        moment.transactionHistory.push({
          type: 'purchase',
          date: transaction.block_timestamp,
          price: transaction.price,
          from: transaction.seller,
          to: transaction.buyer,
          transactionId: transaction.tx_hash,
        });
      }
    });
  }
  
  private mergeBitqueryData(moments: NFLAllDayMoment[], bitqueryData: any[]) {
    bitqueryData.forEach(purchase => {
      const moment = moments.find(m => m.id === purchase.momentId);
      if (moment && !moment.purchasePrice) {
        moment.purchasePrice = purchase.purchasePrice;
        moment.purchaseDate = purchase.purchaseDate;
      }
    });
  }
  
  private async fetchCurrentPrices(moments: NFLAllDayMoment[]) {
    await Promise.all(
      moments.map(async (moment) => {
        try {
          const price = await getMarketplacePrice(moment.id);
          if (price !== null) {
            moment.currentPrice = price;
          }
        } catch (error) {
          console.error(`Error fetching price for moment ${moment.id}:`, error);
        }
      })
    );
  }
  
  private mergeLocalStorageData(moments: NFLAllDayMoment[], walletAddress: string) {
    if (typeof window === 'undefined') return;
    
    moments.forEach(moment => {
      const storageKey = `purchase_${walletAddress}_${moment.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved && !moment.purchasePrice) {
        try {
          const data = JSON.parse(saved);
          moment.purchasePrice = data.purchasePrice;
          moment.purchaseDate = data.purchaseDate;
        } catch (e) {
          console.error('Error parsing localStorage data:', e);
        }
      }
    });
  }
  
  // Export data for user download
  exportToCSV(moments: NFLAllDayMoment[]): string {
    const headers = [
      'Moment ID',
      'Player',
      'Play',
      'Series',
      'Serial Number',
      'Purchase Date',
      'Purchase Price',
      'Current Price',
      'Profit/Loss',
      'ROI %'
    ];
    
    const rows = moments.map(moment => {
      const purchasePrice = moment.purchasePrice || 0;
      const currentPrice = moment.currentPrice || 0;
      const profitLoss = currentPrice - purchasePrice;
      const roi = purchasePrice > 0 ? ((profitLoss / purchasePrice) * 100).toFixed(2) : '0';
      
      return [
        moment.id,
        moment.player.name,
        moment.description,
        moment.series,
        moment.serialNumber,
        moment.purchaseDate || '',
        purchasePrice.toFixed(2),
        currentPrice.toFixed(2),
        profitLoss.toFixed(2),
        roi
      ];
    });
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

// Singleton instance for easy access
let serviceInstance: NFLAllDayService | null = null;

export function getNFLAllDayService(config?: any): NFLAllDayService {
  if (!serviceInstance) {
    serviceInstance = new NFLAllDayService(config);
  }
  return serviceInstance;
}

// Export types
export type { NFLAllDayMoment, TransactionRecord };