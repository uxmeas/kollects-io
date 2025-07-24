import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Navigation() {
  const router = useRouter();
  
  const navItems = [
    {
      name: 'Real-time Portfolio',
      href: '/test-realtime',
      icon: '📊',
      description: 'Live portfolio monitoring'
    },
    {
      name: 'Performance Monitor',
      href: '/phase2-dashboard',
      icon: '⚡',
      description: 'System health & performance'
    },
    {
      name: 'Price Alerts',
      href: '/price-alerts-dashboard',
      icon: '🔔',
      description: 'Price monitoring & alerts'
    },
    {
      name: 'Market Sentiment',
      href: '/market-sentiment-dashboard',
      icon: '🧠',
      description: 'AI-powered market analysis'
    }
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 border-b border-kollects-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🏀</div>
              <div className="text-white font-bold text-lg">kollects.io</div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-kollects-gold text-blue-900 shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                    title={item.description}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div id="mobile-menu" className="hidden md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-900/50">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-kollects-gold text-blue-900'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
                <div className="text-xs text-gray-400 mt-1">{item.description}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 