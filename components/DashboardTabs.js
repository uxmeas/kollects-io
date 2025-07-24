import { useRouter } from 'next/router';

export default function DashboardTabs({ activeTab, onTabChange, isWalletConnected }) {
  const router = useRouter();
  
  const tabs = [
    {
      id: 'portfolio',
      name: 'Portfolio',
      icon: '📊',
      description: 'View your NFT collection',
      href: '/portfolio'
    },
    {
      id: 'alerts',
      name: 'Price Alerts',
      icon: '🔔',
      description: 'Manage price notifications',
      href: '/alerts'
    },
    {
      id: 'sentiment',
      name: 'Market Sentiment',
      icon: '🧠',
      description: 'AI-powered market analysis',
      href: '/sentiment'
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: '⚡',
      description: 'System health & metrics',
      href: '/performance'
    }
  ];

  const handleTabClick = (tab) => {
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }
    onTabChange(tab.id);
    router.push(tab.href);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                disabled={!isWalletConnected}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'border-kollects-gold text-kollects-gold'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-white/30'
                } ${!isWalletConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={tab.description}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 