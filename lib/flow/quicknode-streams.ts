// QuickNode Streams Integration
// Real-time Flow blockchain event monitoring

import { EventEmitter } from 'events';

export class QuickNodeStreams extends EventEmitter {
  private endpoint: string;
  private websocket?: WebSocket;
  private reconnectInterval = 5000;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  
  constructor(endpoint: string) {
    super();
    this.endpoint = endpoint;
  }
  
  // Subscribe to NFL All Day events for a specific wallet
  async subscribeToNFLAllDayEvents(walletAddress: string, callback: (event: any) => void) {
    const eventFilters = [
      {
        contractAddress: '0xe4cf4bdc1751c65d',
        eventTypes: ['Deposit', 'Withdraw', 'MomentMinted', 'PackOpened'],
      },
      {
        contractAddress: '0x8ebcbfd516b1da27',
        eventTypes: ['MomentPurchased', 'MomentListed', 'MomentWithdrawn'],
      },
    ];
    
    // QuickNode Streams configuration
    const streamConfig = {
      network: 'flow-mainnet',
      filters: eventFilters.map(filter => ({
        type: 'event',
        contractAddress: filter.contractAddress,
        eventTypes: filter.eventTypes,
        // Filter by wallet address in event data
        dataFilters: [
          { field: 'to', value: walletAddress },
          { field: 'from', value: walletAddress },
          { field: 'buyer', value: walletAddress },
          { field: 'seller', value: walletAddress },
        ],
      })),
    };
    
    // Connect to QuickNode WebSocket
    this.connect(streamConfig, callback);
  }
  
  // Connect to QuickNode WebSocket endpoint
  private connect(config: any, callback: (event: any) => void) {
    try {
      // For browser environment
      if (typeof window !== 'undefined' && window.WebSocket) {
        this.websocket = new WebSocket(this.endpoint);
        
        this.websocket.onopen = () => {
          console.log('Connected to QuickNode Streams');
          this.reconnectAttempts = 0;
          
          // Send subscription configuration
          this.websocket?.send(JSON.stringify({
            action: 'subscribe',
            ...config,
          }));
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'event') {
              const parsedEvent = this.parseFlowEvent(data);
              callback(parsedEvent);
              this.emit('event', parsedEvent);
            }
          } catch (error) {
            console.error('Error parsing event:', error);
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        };
        
        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          this.handleReconnect(config, callback);
        };
      } else {
        // For Node.js environment, use a polling fallback
        console.warn('WebSocket not available, using polling fallback');
        this.startPolling(config, callback);
      }
    } catch (error) {
      console.error('Connection error:', error);
      this.emit('error', error);
    }
  }
  
  // Handle reconnection logic
  private handleReconnect(config: any, callback: (event: any) => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(config, callback);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Connection failed'));
    }
  }
  
  // Polling fallback for environments without WebSocket
  private async startPolling(config: any, callback: (event: any) => void) {
    // This would poll the QuickNode RPC endpoint for recent events
    // Implementation depends on QuickNode's specific API
    console.log('Polling mode activated');
    
    const pollInterval = setInterval(async () => {
      try {
        // Make RPC call to get recent events
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'flow_getEvents',
            params: [
              config.filters[0].contractAddress,
              config.filters[0].eventTypes[0],
              // Block range parameters
            ],
            id: 1,
          }),
        });
        
        const data = await response.json();
        if (data.result) {
          data.result.forEach((event: any) => {
            const parsedEvent = this.parseFlowEvent(event);
            callback(parsedEvent);
            this.emit('event', parsedEvent);
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    // Store interval ID for cleanup
    this.on('disconnect', () => {
      clearInterval(pollInterval);
    });
  }
  
  // Parse Flow event data
  private parseFlowEvent(rawEvent: any): any {
    const { contractAddress, eventType, data, blockHeight, blockTimestamp, transactionId } = rawEvent;
    
    // Parse based on event type
    if (eventType === 'MomentPurchased') {
      return {
        type: 'purchase',
        momentId: data.id || data.nftID,
        price: this.ducToUSD(data.price),
        seller: data.seller,
        buyer: data.buyer,
        blockHeight,
        blockTimestamp,
        transactionId,
      };
    } else if (eventType === 'Deposit') {
      return {
        type: 'deposit',
        momentId: data.id,
        to: data.to,
        blockHeight,
        blockTimestamp,
        transactionId,
      };
    } else if (eventType === 'PackOpened') {
      return {
        type: 'pack_opened',
        packId: data.packID,
        moments: data.momentIDs,
        opener: data.opener,
        blockHeight,
        blockTimestamp,
        transactionId,
      };
    }
    
    // Default parsing
    return {
      type: eventType.toLowerCase(),
      data,
      blockHeight,
      blockTimestamp,
      transactionId,
    };
  }
  
  // Convert DUC to USD
  private ducToUSD(ducAmount: string | number): number {
    const duc = typeof ducAmount === 'string' ? parseFloat(ducAmount) : ducAmount;
    return duc / 100000000; // DUC has 8 decimal places
  }
  
  // Disconnect from streams
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = undefined;
    }
    this.emit('disconnect');
  }
}

// Example usage:
// const quicknode = new QuickNodeStreams('wss://your-endpoint.quiknode.pro');
// quicknode.subscribeToNFLAllDayEvents('0x123...', (event) => {
//   console.log('New event:', event);
// });

export default QuickNodeStreams;