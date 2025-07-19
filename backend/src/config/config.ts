import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/silentintellect',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Blockchain
  ethereumRpcUrl: process.env.ETHEREUM_RPC_URL || 'http://localhost:8545',
  polygonRpcUrl: process.env.POLYGON_RPC_URL || '',
  privateKey: process.env.PRIVATE_KEY || '',
  
  // Contract addresses (will be populated after deployment)
  contracts: {
    identityRegistry: process.env.IDENTITY_REGISTRY_ADDRESS || '',
    credentialManager: process.env.CREDENTIAL_MANAGER_ADDRESS || '',
    lendingPool: process.env.LENDING_POOL_ADDRESS || '',
    governanceToken: process.env.GOVERNANCE_TOKEN_ADDRESS || '',
  },
  
  // External APIs
  infuraApiKey: process.env.INFURA_API_KEY || '',
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || '',
  
  // AWS (for deployment)
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Feature flags
  features: {
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableGovernance: process.env.ENABLE_GOVERNANCE === 'true',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
  },
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'DATABASE_URL',
    'REDIS_URL',
    'ETHEREUM_RPC_URL',
    'PRIVATE_KEY'
  );
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

