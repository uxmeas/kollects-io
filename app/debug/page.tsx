export default function Debug() {
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Debug Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={() => alert('Inline onClick works!')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test Inline onClick
        </button>
        
        <br />
        
        <a href="/" className="text-blue-500 underline">
          Regular HTML Link to Home
        </a>
        
        <br />
        
        <button 
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          JavaScript Navigation to Home
        </button>
      </div>
      
      <div className="mt-8 text-sm text-gray-600">
        <p>If buttons don't work, check browser console for errors.</p>
        <p>Press F12 or right-click → Inspect → Console</p>
      </div>
    </div>
  );
}