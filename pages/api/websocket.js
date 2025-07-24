// WebSocket API endpoint for real-time updates
// Provides live portfolio data updates to connected clients

import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('🔌 Setting up WebSocket server...');
    const io = new Server(res.socket.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });
    
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      socket.on('subscribe-wallet', async (walletAddress) => {
        console.log(`📡 Client ${socket.id} subscribing to wallet: ${walletAddress}`);
        socket.join(`wallet-${walletAddress}`);
        
                       // Send initial data
               try {
                 // Import Enhanced Flow API service dynamically to avoid circular dependencies
                 const EnhancedFlowAPIService = (await import('../../lib/flow-api-service-enhanced.js')).default;
                 const flowService = new EnhancedFlowAPIService();
          
          // Get portfolio data with caching
          const portfolioData = await flowService.getPortfolioData(walletAddress);
          
          socket.emit('portfolio-update', {
            type: 'initial',
            data: portfolioData,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Sent initial data for wallet ${walletAddress}`);
        } catch (error) {
          console.error(`❌ Error fetching initial data for ${walletAddress}:`, error);
          socket.emit('error', { 
            message: 'Failed to fetch initial data',
            details: error.message 
          });
        }
      });

      socket.on('unsubscribe-wallet', (walletAddress) => {
        socket.leave(`wallet-${walletAddress}`);
        console.log(`📡 Client ${socket.id} unsubscribed from wallet: ${walletAddress}`);
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    // Set up periodic updates for active wallets
    setInterval(async () => {
      const rooms = io.sockets.adapter.rooms;
      const activeWallets = [];
      
      for (const [roomName, sockets] of rooms) {
        if (roomName.startsWith('wallet-')) {
          const walletAddress = roomName.replace('wallet-', '');
          activeWallets.push(walletAddress);
        }
      }

      if (activeWallets.length > 0) {
        console.log(`🔄 Updating ${activeWallets.length} active wallets...`);
        
                       for (const walletAddress of activeWallets) {
                 try {
                   // Import Enhanced Flow API service dynamically
                   const EnhancedFlowAPIService = (await import('../../lib/flow-api-service-enhanced.js')).default;
                   const flowService = new EnhancedFlowAPIService();
            
            const portfolioData = await flowService.getPortfolioData(walletAddress);
            
            io.to(`wallet-${walletAddress}`).emit('portfolio-update', {
              type: 'update',
              data: portfolioData,
              timestamp: new Date().toISOString()
            });
            
          } catch (error) {
            console.error(`❌ Error updating wallet ${walletAddress}:`, error);
            io.to(`wallet-${walletAddress}`).emit('error', {
              message: 'Failed to update portfolio data',
              details: error.message
            });
          }
        }
      }
    }, 30000); // Update every 30 seconds

    // Health check endpoint
    io.on('health-check', () => {
      const stats = {
        connectedClients: io.engine.clientsCount,
        activeRooms: io.sockets.adapter.rooms.size,
        timestamp: new Date().toISOString()
      };
      return stats;
    });

    console.log('✅ WebSocket server initialized successfully');
  }
  
  res.end();
};

export default ioHandler; 