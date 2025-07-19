import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import WalletConnection from '../components/WalletConnection';
import IdentityCard from '../components/IdentityCard';
import DeFiDashboard from '../components/DeFiDashboard';
import { useIdentity } from '../hooks/useIdentity';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { identity, loading: identityLoading } = useIdentity(address);
  const [activeTab, setActiveTab] = useState<'identity' | 'defi'>('identity');

  return (
    <>
      <Head>
        <title>SilentIntellect - Blockchain DeFi & Digital Identity</title>
        <meta
          name="description"
          content="Decentralized Finance and Digital Identity Management Platform"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  Your Digital Identity,
                  <span className="text-primary-600"> Your Financial Future</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Experience the next generation of decentralized finance with secure,
                  self-sovereign identity management. Take control of your data and assets.
                </p>
                
                {!isConnected ? (
                  <WalletConnection />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block"
                  >
                    <p className="text-green-800 font-medium">
                      ✅ Wallet Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
            </div>
          </section>

          {/* Main Application */}
          {isConnected && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Tab Navigation */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-lg p-1 shadow-sm border">
                  <button
                    onClick={() => setActiveTab('identity')}
                    className={`px-6 py-3 rounded-md font-medium transition-all ${
                      activeTab === 'identity'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Digital Identity
                  </button>
                  <button
                    onClick={() => setActiveTab('defi')}
                    className={`px-6 py-3 rounded-md font-medium transition-all ${
                      activeTab === 'defi'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    DeFi Dashboard
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'identity' && (
                  <IdentityCard address={address} identity={identity} loading={identityLoading} />
                )}
                {activeTab === 'defi' && (
                  <DeFiDashboard address={address} />
                )}
              </motion.div>
            </section>
          )}

          {/* Features Section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose SilentIntellect?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built on cutting-edge blockchain technology with user privacy and security at its core.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-xl p-8 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </Layout>
    </>
  );
}

// Feature data
const features = [
  {
    title: 'Self-Sovereign Identity',
    description: 'Complete control over your digital identity and personal data. No central authority can access or modify your information without permission.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Decentralized Finance',
    description: 'Access lending, borrowing, and other financial services without traditional intermediaries. Earn rewards and participate in governance.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
  },
  {
    title: 'Enhanced Security',
    description: 'Multi-layered security with zero-knowledge proofs, encryption, and smart contract audits. Your assets and data are protected.',
    icon: ({ className }: { className: string }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

