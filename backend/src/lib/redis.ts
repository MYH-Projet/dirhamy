import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_URL||'127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('error', (err:Error) => {
  console.error('❌ Redis error:', err);
});

export default redisClient;
