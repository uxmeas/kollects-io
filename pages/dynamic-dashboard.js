import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DynamicDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const router = useRouter();

  // Enhanced script that distinguishes between TopShot and general moments
  const enhancedScript = `
import TopShot from 0x0b2a3299cc857e29
import NonFungibleToken from 0x1d7e57aa55817448

access(all) fun main(account: Address): {String: AnyStruct} {
    let acct = getAccount(account)
    var result: {String: AnyStruct} = {}
    
    // Get TopShot moments from specific collection
    var topShotMoments: [UInt64] = []
    if let topShotCap = acct.capabilities.borrow<&{TopShot.MomentCollectionPublic}>(/public/TopShotMomentCollection) {
        let topShotIds = topShotCap.getIDs()
        for id in topShotIds {
            topShotMoments.append(id)
        }
    }
    
    // Get general moments (includes TopShot, AllDay, and other collections)
    var generalMoments: [UInt64] = []
    if let generalCap = acct.capabilities.borrow<&{NonFungibleToken.CollectionPublic}>(/public/MomentCollection) {
        let generalIds = generalCap.getIDs()
        for id in generalIds {
            generalMoments.append(id)
        }
    }
    
    result["topShotMoments"] = topShotMoments
    result["generalMoments"] = generalMoments
    result["totalTopShot"] = topShotMoments.length
    result["totalGeneral"] = generalMoments.length
    result["totalMoments"] = topShotMoments.length + generalMoments.length
    
    return result
}`;

  useEffect(() => {
    if (router.isReady) {
      const { wallet } = router.query;
      if (wallet) {
        setWalletAddress(wallet);
        fetchData(wallet);
      }
    }
  }, [router.isReady, router.query]);

  const fetchData = async (address) => {
    try {
      setLoading(true);
      setError(null);

      const script = Buffer.from(enhancedScript).toString('base64');
      const walletArg = Buffer.from(JSON.stringify({
        type: 'Address',
        value: address
      })).toString('base64');

      const response = await fetch('/api/flow-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          arguments: [walletArg]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Parse the base64 response
      const decoded = Buffer.from(result, 'base64').toString('utf-8');
      const parsedData = JSON.parse(decoded);
      
      // Extract data from the enhanced response
      const extractValue = (key) => {
        if (parsedData.value && Array.isArray(parsedData.value)) {
          const item = parsedData.value.find(item => item.key.value === key);
          return item ? item.value.value : null;
        }
        return null;
      };
      
      const extractMomentIds = (moments) => {
        if (!moments) return [];
        return moments.map(moment => {
          if (typeof moment === 'object' && moment.value !== undefined) {
            return moment.value;
          }
          return moment;
        });
      };
      
      // Extract the different moment collections
      const topShotMoments = extractMomentIds(extractValue('topShotMoments') || []);
      const generalMoments = extractMomentIds(extractValue('generalMoments') || []);
      
      const totalTopShot = parseInt(extractValue('totalTopShot') || 0);
      const totalGeneral = parseInt(extractValue('totalGeneral') || 0);
      const totalMoments = parseInt(extractValue('totalMoments') || 0);
      
      // Determine if we have real data and what type
      const hasTopShot = totalTopShot > 0;
      const hasGeneral = totalGeneral > 0;
      const hasRealData = totalMoments > 0;
      
      // Set the data in the format expected by the frontend
      setData({
        topShotMoments: topShotMoments,
        allDayMoments: [], // Will be empty for now
        generalMoments: generalMoments,
        totalMoments: totalMoments,
        totalTopShot: totalTopShot,
        totalAllDay: 0, // Will be 0 for now
        totalGeneral: totalGeneral,
        hasRealData: hasRealData,
        hasTopShot: hasTopShot,
        hasAllDay: false, // Will be false for now
        hasGeneral: hasGeneral
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewWallet = () => {
    router.push('/wallet-input');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Loading Portfolio...</h2>
          <p className="text-blue-200">Fetching NBA Top Shot & NFL All Day data from blockchain</p>
          <p className="text-sm text-blue-300 mt-2">Wallet: {walletAddress}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => fetchData(walletAddress)}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Retry
            </button>
            <button
              onClick={handleNewWallet}
              className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Try Different Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🏀 NBA Top Shot & 🏈 NFL All Day Portfolio</h1>
          <p className="text-xl text-blue-200 mb-4">Real-time blockchain data</p>
          <div className="bg-white/10 rounded-lg p-4 inline-block">
            <p className="text-sm font-mono text-blue-100">Wallet: {walletAddress}</p>
          </div>
          <button
            onClick={handleNewWallet}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Try Different Wallet
          </button>
          {data && data.hasRealData && (
            <div className="mt-4 bg-blue-900/50 rounded-lg p-3 max-w-2xl mx-auto">
              <p className="text-sm text-blue-200">
                💡 <strong>Collection Analysis:</strong> 
                {data.hasTopShot && ` ${data.totalTopShot} TopShot moments`}
                {data.hasAllDay && ` ${data.totalAllDay} AllDay moments`}
                {data.hasGeneral && ` ${data.totalGeneral} moments in general collection`}
                {!data.hasTopShot && !data.hasAllDay && !data.hasGeneral && ' No moments found'}
              </p>
              {data.hasGeneral && data.totalGeneral > 0 && (
                <p className="text-xs text-blue-300 mt-1">
                  Note: General collection moments may include TopShot, AllDay, and other NFT collections
                </p>
              )}
            </div>
          )}
        </div>

        {/* Data Display */}
        {data && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Moments */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {data.totalMoments || 0}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Total Moments</h3>
                <p className="text-gray-600 text-sm">All Collections</p>
              </div>
            </div>

            {/* TopShot Moments */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {data.totalTopShot || 0}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">TopShot Moments</h3>
                <p className="text-gray-600 text-sm">NBA Top Shot</p>
              </div>
            </div>

            {/* AllDay Moments */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {data.totalAllDay || 0}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">AllDay Moments</h3>
                <p className="text-gray-600 text-sm">NFL All Day</p>
              </div>
            </div>

            {/* General Moments */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {data.totalGeneral || 0}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">General Moments</h3>
                <p className="text-gray-600 text-sm">Other Collections</p>
              </div>
            </div>
          </div>
        )}

        {/* TopShot Moment IDs Display */}
        {data && data.topShotMoments && data.topShotMoments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🏀 NBA Top Shot Moment IDs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {data.topShotMoments.slice(0, 24).map((id, index) => (
                <div key={index} className="bg-green-50 rounded-lg p-2 text-center">
                  <span className="text-sm font-mono text-green-800">
                    {typeof id === 'object' && id.value ? id.value : id}
                  </span>
                </div>
              ))}
              {data.topShotMoments.length > 24 && (
                <div className="col-span-full text-center text-gray-600 mt-4">
                  ... and {data.topShotMoments.length - 24} more TopShot moments
                </div>
              )}
            </div>
          </div>
        )}

        {/* AllDay Moment IDs Display */}
        {data && data.allDayMoments && data.allDayMoments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🏈 NFL All Day Moment IDs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {data.allDayMoments.slice(0, 24).map((id, index) => (
                <div key={index} className="bg-purple-50 rounded-lg p-2 text-center">
                  <span className="text-sm font-mono text-purple-800">
                    {typeof id === 'object' && id.value ? id.value : id}
                  </span>
                </div>
              ))}
              {data.allDayMoments.length > 24 && (
                <div className="col-span-full text-center text-gray-600 mt-4">
                  ... and {data.allDayMoments.length - 24} more AllDay moments
                </div>
              )}
            </div>
          </div>
        )}

        {/* General Moment IDs Display */}
        {data && data.generalMoments && data.generalMoments.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">📦 General Moment IDs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {data.generalMoments.slice(0, 24).map((id, index) => (
                <div key={index} className="bg-orange-50 rounded-lg p-2 text-center">
                  <span className="text-sm font-mono text-orange-800">
                    {typeof id === 'object' && id.value ? id.value : id}
                  </span>
                </div>
              ))}
              {data.generalMoments.length > 24 && (
                <div className="col-span-full text-center text-gray-600 mt-4">
                  ... and {data.generalMoments.length - 24} more general moments
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {data && (!data.topShotMoments || data.topShotMoments.length === 0) && 
         (!data.allDayMoments || data.allDayMoments.length === 0) && 
         (!data.generalMoments || data.generalMoments.length === 0) && (
          <div className="mt-8 bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Moments Found</h3>
            <p className="text-gray-600 mb-4">
              This wallet doesn't appear to have any NBA Top Shot or NFL All Day moments in their collection.
            </p>
            <button
              onClick={handleNewWallet}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Try Different Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 