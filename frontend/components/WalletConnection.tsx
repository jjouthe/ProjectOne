import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { motion } from 'framer-motion';

export default function WalletConnection() {
  const { open } = useWeb3Modal();
  const { isConnected } = useAccount();

  if (isConnected) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => open()}
      className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-colors"
    >
      Connect Wallet
    </motion.button>
  );
}
