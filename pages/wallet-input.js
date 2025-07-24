import { useState } from 'react';
import { useRouter } from 'next/router';

export default function WalletInput() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();

  const validateWalletAddress = (address) => {
    // Flow wallet address validation (0x followed by 16 hex characters)
    const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/;
    return flowAddressRegex.test(address);
  };

  const handleAddressChange = (e) => {
    const address = e.target.value;
    setWalletAddress(address);
    setIsValid(validateWalletAddress(address));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      // Navigate to dashboard with wallet address as query parameter
      router.push(`/dynamic-dashboard?wallet=${encodeURIComponent(walletAddress)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏀 NBA Top Shot Portfolio
          </h1>
          <p className="text-gray-600">
            Enter any Flow wallet address to view their NBA Top Shot collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-2">
              Flow Wallet Address
            </label>
            <input
              type="text"
              id="wallet"
              value={walletAddress}
              onChange={handleAddressChange}
              placeholder="0x1234567890abcdef"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                walletAddress && !isValid ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {walletAddress && !isValid && (
              <p className="mt-2 text-sm text-red-600">
                Please enter a valid Flow wallet address (0x followed by 16 hex characters)
              </p>
            )}
            {isValid && (
              <p className="mt-2 text-sm text-green-600">
                ✅ Valid Flow wallet address
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              isValid
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isValid ? '🚀 View Portfolio' : 'Enter Valid Address'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter any Flow blockchain wallet address</li>
            <li>• View their NBA Top Shot moments</li>
            <li>• No pre-coded wallets - completely dynamic</li>
            <li>• Real-time blockchain data</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Example: 
          </p>
        </div>
      </div>
    </div>
  );
} 