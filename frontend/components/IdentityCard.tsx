import React from 'react';
// import { useAccount } from 'wagmi';

interface IdentityCardProps {
  address?: string | null;
  identity?: any;
  loading?: boolean;
  className?: string;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ 
  address = null, 
  identity = null, 
  loading = false, 
  className = '' 
}) => {
  // Mock data for demo purposes
  const isConnected = false; // Will be true when Web3 is restored
  const mockAddress = "0x1234...5678";
  const mockIdentity = {
    name: "Demo User",
    verified: true,
    credentialsCount: 3,
    reputation: 95
  };

  // Show demo version instead of connection requirement
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Digital Identity</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-2">
          <p className="text-blue-800 text-sm font-medium">🎯 Demo Mode</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">{mockIdentity.name.charAt(0)}</span>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{mockIdentity.name}</h4>
            <p className="text-gray-600 font-mono text-sm">{mockAddress}</p>
            <div className="flex items-center mt-1">
              {mockIdentity.verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{mockIdentity.credentialsCount}</div>
            <div className="text-sm text-gray-600">Credentials</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{mockIdentity.reputation}%</div>
            <div className="text-sm text-gray-600">Reputation</div>
          </div>
        </div>

        {/* Credentials */}
        <div>
          <h5 className="text-sm font-medium text-gray-900 mb-3">Recent Credentials</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">KYC Verification</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Education Certificate</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Professional License</span>
              </div>
              <span className="text-xs text-green-600 font-medium">Verified</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Add Credential
          </button>
          <button className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors">
            Share Identity
          </button>
        </div>
      </div>
    </div>
    );
};

export default IdentityCard;
