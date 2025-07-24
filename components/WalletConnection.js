import { useState, useEffect } from 'react';

export default function WalletConnection({ onWalletConnect, connectedWallet }) {
  const [walletAddress, setWalletAddress] = useState(connectedWallet || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (connectedWallet) {
      setWalletAddress(connectedWallet);
      setConnectionStatus('connected');
    }
  }, [connectedWallet]);

  const handleConnect = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter a valid Flow wallet address');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate wallet format (basic Flow address validation)
      if (!walletAddress.startsWith('0x') || walletAddress.length !== 18) {
        throw new Error('Invalid Flow wallet address format');
      }

      onWalletConnect(walletAddress);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      alert(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    setWalletAddress('');
    onWalletConnect(null);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Failed';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 border-b border-kollects-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🏀</div>
            <div className="text-white font-bold text-lg">kollects.io</div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {connectionStatus === 'connected' ? (
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                  <span>{getStatusIcon()}</span>
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <div className="text-gray-300 text-sm font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                  <span>{getStatusIcon()}</span>
                  <span className="text-sm font-medium">{getStatusText()}</span>
                </div>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter Flow wallet address (0x...)"
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-kollects-gold text-sm w-64"
                  disabled={isConnecting}
                />
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !walletAddress.trim()}
                  className="px-4 py-1 bg-kollects-gold text-blue-900 font-semibold rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 