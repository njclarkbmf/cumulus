'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function DashboardPage() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">My Portfolio</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to view your portfolio</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-600 text-sm mb-1">Total Tokens Owned</h3>
          <p className="text-3xl font-bold">5</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm mb-1">Portfolio Value</h3>
          <p className="text-3xl font-bold text-primary-600">₱2,500,000</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm mb-1">Active Listings</h3>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>

      {/* Maintenance Status */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Maintenance Fee Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-semibold">Cumulus Makati Condo A - Token #1</p>
              <p className="text-sm text-gray-600">Status: <span className="text-success font-medium">Current</span></p>
            </div>
            <span className="badge badge-success">Paid until May 5, 2026</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="font-semibold">Cumulus BGC Tower Unit - Token #15</p>
              <p className="text-sm text-gray-600">Status: <span className="text-warning font-medium">Due in 3 days</span></p>
            </div>
            <button className="btn-primary text-sm">Pay Now</button>
          </div>
        </div>
      </div>

      {/* Your Tokens */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Your Tokens</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Property</th>
                <th className="text-left py-3 px-4">Token ID</th>
                <th className="text-left py-3 px-4">Maintenance</th>
                <th className="text-left py-3 px-4">Value</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Cumulus Makati Condo A</td>
                <td className="py-3 px-4 font-mono">#1</td>
                <td className="py-3 px-4"><span className="badge badge-success">Current</span></td>
                <td className="py-3 px-4 font-semibold">₱500,000</td>
                <td className="py-3 px-4">
                  <button className="btn-primary text-sm mr-2">List for Sale</button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Cumulus BGC Tower Unit</td>
                <td className="py-3 px-4 font-mono">#15</td>
                <td className="py-3 px-4"><span className="badge badge-warning">Due Soon</span></td>
                <td className="py-3 px-4 font-semibold">₱750,000</td>
                <td className="py-3 px-4">
                  <button className="btn-primary text-sm mr-2">List for Sale</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Bought Token #1 - Cumulus Makati Condo A</p>
              <p className="text-sm text-gray-500">April 1, 2026</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">₱500,000</p>
              <a href="#" className="text-sm text-primary-600">View on Polygonscan</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
