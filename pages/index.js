import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-kollects-gold mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Redirecting...</h2>
        <p className="text-blue-200">Taking you to the new unified dashboard</p>
      </div>
    </div>
  );
} 