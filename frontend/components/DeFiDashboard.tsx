import React, { useState } from 'react';
import { useAccount, useBalance } from 'wagmi';

interface DeFiDashboardProps {
  className?: string;
}

const DeFiDashboard: React.FC<DeFiDashboardProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [activeTab, setActiveTab] = useState<'lending' | 'borrowing' | 'governance'>('lending');

  if (!isConnected) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">DeFi Dashboard</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-gray-500">Connect your wallet to access DeFi features</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">DeFi Dashboard</h3>
        <div className="flex items-center space-x-2">
          <span className="status-connected">Connected</span>
          <div className="text-sm text-gray-600">
            Balance: {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {(['lending', 'borrowing', 'governance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Lending Tab */}
      {activeTab === 'lending' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supply */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Supply Assets</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">Total Supplied</span>
                  <span className="font-medium text-green-900">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700">APY</span>
                  <span className="font-medium text-green-900">4.2%</span>
                </div>
                <button className="btn-success w-full">
                  Supply ETH
                </button>
              </div>
            </div>

            {/* Earn */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Earnings</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Total Earned</span>
                  <span className="font-medium text-blue-900">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Rewards</span>
                  <span className="font-medium text-blue-900">0 DFID</span>
                </div>
                <button className="btn-primary w-full">
                  Claim Rewards
                </button>
              </div>
            </div>
          </div>

          {/* Available Markets */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Available Markets</h4>
            <div className="space-y-2">
              {[
                { asset: 'ETH', apy: '4.2%', supplied: '$1.2M' },
                { asset: 'USDC', apy: '3.8%', supplied: '$2.1M' },
                { asset: 'DAI', apy: '3.5%', supplied: '$890K' },
              ].map((market) => (
                <div key={market.asset} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{market.asset}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{market.asset}</p>
                      <p className="text-xs text-gray-500">Supply APY: {market.apy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{market.supplied}</p>
                    <button className="text-xs text-blue-600 hover:text-blue-800">
                      Supply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Borrowing Tab */}
      {activeTab === 'borrowing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Borrow */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Borrow Assets</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Total Borrowed</span>
                  <span className="font-medium text-red-900">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-700">Borrow APY</span>
                  <span className="font-medium text-red-900">5.8%</span>
                </div>
                <button className="btn-danger w-full">
                  Borrow USDC
                </button>
              </div>
            </div>

            {/* Collateral */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Collateral</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Total Collateral</span>
                  <span className="font-medium text-purple-900">$0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Health Factor</span>
                  <span className="font-medium text-purple-900">∞</span>
                </div>
                <button className="btn-secondary w-full">
                  Add Collateral
                </button>
              </div>
            </div>
          </div>

          {/* Credit Score */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Credit Score</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Credit Score</span>
                  <span className="font-medium">750</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">Excellent</p>
                <p className="text-xs text-gray-500">Based on verified credentials</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Governance Tab */}
      {activeTab === 'governance' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-3">Governance Tokens</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">DFID Balance</span>
                <span className="font-medium text-indigo-900">0 DFID</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-indigo-700">Voting Power</span>
                <span className="font-medium text-indigo-900">0%</span>
              </div>
              <button className="btn-primary w-full">
                Get DFID Tokens
              </button>
            </div>
          </div>

          {/* Active Proposals */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Active Proposals</h4>
            <div className="space-y-3">
              {[
                {
                  id: 1,
                  title: 'Increase lending pool rewards',
                  status: 'Active',
                  votes: '1.2M DFID',
                  timeLeft: '5 days'
                },
                {
                  id: 2,
                  title: 'Add new collateral asset: LINK',
                  status: 'Active',
                  votes: '890K DFID',
                  timeLeft: '12 days'
                }
              ].map((proposal) => (
                <div key={proposal.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-gray-900">{proposal.title}</h5>
                    <span className="status-connected">{proposal.status}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-3">
                    <span>Total votes: {proposal.votes}</span>
                    <span>Time left: {proposal.timeLeft}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-success flex-1">Vote For</button>
                    <button className="btn-danger flex-1">Vote Against</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeFiDashboard;
