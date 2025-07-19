import React from 'react';
import { useAccount } from 'wagmi';

interface IdentityCardProps {
  className?: string;
}

const IdentityCard: React.FC<IdentityCardProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Digital Identity</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500">Connect your wallet to view your digital identity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Digital Identity</h3>
        <span className="status-connected">Connected</span>
      </div>
      
      <div className="space-y-4">
        {/* Wallet Address */}
        <div>
          <label className="form-label">Wallet Address</label>
          <div className="wallet-address">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          </div>
        </div>

        {/* Identity Status */}
        <div>
          <label className="form-label">Identity Status</label>
          <div className="flex items-center space-x-2">
            <span className="status-pending">Pending Verification</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              Complete KYC
            </button>
          </div>
        </div>

        {/* Credentials */}
        <div>
          <label className="form-label">Verified Credentials</label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Verification</p>
                  <p className="text-xs text-gray-500">Verified on blockchain</p>
                </div>
              </div>
              <span className="status-connected">Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Government ID</p>
                  <p className="text-xs text-gray-500">Pending verification</p>
                </div>
              </div>
              <span className="status-pending">Pending</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <button className="btn-primary flex-1">
            Add Credential
          </button>
          <button className="btn-secondary">
            Export Identity
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdentityCard;
