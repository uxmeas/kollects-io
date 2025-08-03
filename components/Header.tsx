'use client';

import Link from 'next/link';
import WalletButton from './WalletButton';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="rounded">
              <rect width="100" height="100" rx="20" fill="#2563EB"/>
              <path d="M30 40L50 25L70 40V65C70 67.7614 67.7614 70 65 70H35C32.2386 70 30 67.7614 30 65V40Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="50" cy="50" r="8" fill="white"/>
            </svg>
            <span className="text-xl font-bold">Kollects.io</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link href="/demo" className="text-gray-600 hover:text-gray-900">
              Demo
            </Link>
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  );
}