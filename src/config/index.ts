import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'DATABASE_URL',
  'STELLAR_NETWORK',
  'STELLAR_SECRET_KEY',
  'JWT_SECRET',
  'REDIS_URL',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL as string,
  stellarNetwork: process.env.STELLAR_NETWORK as 'testnet' | 'public',
  stellarSecretKey: process.env.STELLAR_SECRET_KEY as string,
  jwtSecret: process.env.JWT_SECRET as string,
  redisUrl: process.env.REDIS_URL as string,
};
