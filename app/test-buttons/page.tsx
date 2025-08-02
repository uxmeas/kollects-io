'use client';

import { useRouter } from 'next/navigation';

export default function TestButtons() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Button Navigation</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <button
            onClick={() => alert('Button works!')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Alert
          </button>
          
          <button
            onClick={() => router.push('/collection/0xa2c60db5a2545622')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Collection (0xa2c60db5a2545622)
          </button>
          
          <button
            onClick={() => console.log('Console log test')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Console Log
          </button>
        </div>
      </div>
    </div>
  );
}