import { useState } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function WalletConnection() {
  const [isOpen, setIsOpen] = useState(false);
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect();
  const { isConnected } = useAccount();

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector });
      setIsOpen(false);
      toast.success('Wallet connected successfully!');
    } catch (error) {
      toast.error('Failed to connect wallet');
    }
  };

  if (isConnected) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors"
      >
        Connect Wallet
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black bg-opacity-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Connect Wallet</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {connectors.map((connector) => (
                  <motion.button
                    key={connector.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!connector.ready || isLoading}
                    onClick={() => handleConnect(connector)}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getWalletIcon(connector.name)}
                      </div>
                      <span className="font-medium text-gray-900">{connector.name}</span>
                    </div>
                    
                    {isLoading && connector.id === pendingConnector?.id && (
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </motion.button>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-800 text-sm">{error.message}</p>
                </motion.div>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  By connecting a wallet, you agree to our{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function getWalletIcon(walletName: string) {
  switch (walletName.toLowerCase()) {
    case 'metamask':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22.5 12c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12 6.201 1.5 12 1.5 22.5 6.201 22.5 12z" fill="#F6851B"/>
          <path d="M12 22.5c5.799 0 10.5-4.701 10.5-10.5S17.799 1.5 12 1.5 1.5 6.201 1.5 12 6.201 22.5 12 22.5z" stroke="#F6851B" strokeWidth="0.5"/>
        </svg>
      );
    case 'walletconnect':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3B99FC">
          <path d="M5.5 9.5c3.5-3.5 9.5-3.5 13 0l.5.5-2 2-.5-.5c-2.5-2.5-6.5-2.5-9 0l-.5.5-2-2 .5-.5z"/>
          <path d="M8.5 12.5c2-2 5-2 7 0l.5.5-2 2-.5-.5c-1-1-2.5-1-3.5 0l-.5.5-2-2 .5-.5z"/>
          <circle cx="12" cy="17" r="1.5"/>
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
  }
}

