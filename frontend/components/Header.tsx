'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Cumulus</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex gap-6">
            <Link href="/properties" className="text-gray-600 hover:text-primary-600">
              Properties
            </Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-primary-600">
              Marketplace
            </Link>
            <Link href="/governance" className="text-gray-600 hover:text-primary-600">
              Governance
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-primary-600">
              Dashboard
            </Link>
          </nav>

          {/* Wallet Connection */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
