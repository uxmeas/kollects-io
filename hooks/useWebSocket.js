// React hook for WebSocket real-time updates
// Provides live portfolio data updates to React components

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useWebSocket(walletAddress) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!walletAddress) return;

    try {
      // Connect to WebSocket server
      const socket = io({
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        setConnectionAttempts(0);
        
        // Subscribe to wallet updates
        socket.emit('subscribe-wallet', walletAddress);
      });

      socket.on('portfolio-update', (update) => {
        console.log('📊 Portfolio update received:', update.type);
        setData(update.data);
        setLastUpdate(new Date(update.timestamp));
        setError(null);
      });

      socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        setError(error.message || 'Connection error');
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setIsConnected(false);
        
        // Attempt reconnection for unexpected disconnects
        if (reason === 'io server disconnect') {
          setConnectionAttempts(prev => prev + 1);
          if (connectionAttempts < 3) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, 2000);
          }
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError(null);
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ WebSocket reconnection error:', error);
        setError(`Reconnection failed: ${error.message}`);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket reconnection failed');
        setError('Failed to reconnect after multiple attempts');
      });

    } catch (error) {
      console.error('❌ Error setting up WebSocket:', error);
      setError(`Setup error: ${error.message}`);
    }
  }, [walletAddress, connectionAttempts]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe-wallet', walletAddress);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
  }, [walletAddress]);

  const sendPing = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('ping');
    }
  }, [isConnected]);

  // Connect on mount or wallet address change
  useEffect(() => {
    if (walletAddress) {
      connect();
    }

    // Cleanup on unmount or wallet address change
    return () => {
      disconnect();
    };
  }, [walletAddress, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-reconnect if connection is lost
  useEffect(() => {
    if (!isConnected && walletAddress && connectionAttempts < 3) {
      const timeout = setTimeout(() => {
        connect();
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isConnected, walletAddress, connectionAttempts, connect]);

  return {
    data,
    isConnected,
    error,
    lastUpdate,
    connectionAttempts,
    sendPing,
    reconnect: connect,
    disconnect
  };
}

// Hook for getting WebSocket connection status
export function useWebSocketStatus() {
  const [status, setStatus] = useState({
    isConnected: false,
    lastPing: null,
    latency: null
  });

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus(prev => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      setStatus(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      setStatus(prev => ({
        ...prev,
        lastPing: new Date(),
        latency
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const ping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('ping');
    }
  }, []);

  return { ...status, ping };
} 