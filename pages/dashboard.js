import { useState, useEffect } from 'react';
import WalletConnection from '../components/WalletConnection';
import DashboardTabs from '../components/DashboardTabs';
import PortfolioView from '../components/PortfolioView';
import AlertsView from '../components/AlertsView';
import SentimentView from '../components/SentimentView';
import PerformanceView from '../components/PerformanceView';

export default function Dashboard() {
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    // Check if wallet is connected from localStorage
    const savedWallet = localStorage.getItem('kollects-wallet');
    if (savedWallet) {
      setConnectedWallet(savedWallet);
      setIsWalletConnected(true);
    }
  }, []);

  const handleWalletConnect = (walletAddress) => {
    if (walletAddress) {
      setConnectedWallet(walletAddress);
      setIsWalletConnected(true);
      localStorage.setItem('kollects-wallet', walletAddress);
    } else {
      setConnectedWallet(null);
      setIsWalletConnected(false);
      localStorage.removeItem('kollects-wallet');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderActiveTab = () => {
    if (!isWalletConnected) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-300">Please connect your Flow wallet to view your dashboard</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'portfolio':
        return <PortfolioView walletAddress={connectedWallet} />;
      case 'alerts':
        return <AlertsView walletAddress={connectedWallet} />;
      case 'sentiment':
        return <SentimentView walletAddress={connectedWallet} />;
      case 'performance':
        return <PerformanceView />;
      default:
        return <PortfolioView walletAddress={connectedWallet} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Wallet Connection Header */}
      <WalletConnection 
        onWalletConnect={handleWalletConnect}
        connectedWallet={connectedWallet}
      />

      {/* Dashboard Tabs */}
      <DashboardTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isWalletConnected={isWalletConnected}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>
    </div>
  );
} 