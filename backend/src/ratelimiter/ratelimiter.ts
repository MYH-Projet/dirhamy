import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from '../lib/redis';

// LAYER 1: Capacity Protection
// Stops scripts from flooding your API.
export const globalIpLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'limit_ip_global',
    points: 60,         // 60 requests
    duration: 60,       // per 1 minute
    blockDuration: 60 * 5 // Block for 5 minutes if they exceed
});

// LAYER 2: Brute Force Protection (Targeted)
// Stops a specific IP from spamming a specific account.
export const emailIpLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'limit_login_attempt',
  points: 5,              // 5 failed attempts...
  duration: 15 * 60,      // ...per 15 minutes
  blockDuration: 60 * 60, // Block that IP+Email combo for 1 hour
});

export const emailSendLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'email_send_limit',
    points: 3,        // Max 3 emails...
    duration: 60 * 60 // ...per 1 hour
});

export const apiLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'limit_api_general',
    points: 300,        // 300 requests
    duration: 5 * 60,   // per 5 minutes
    blockDuration: 60   // Block for 1 minute if exceeded
});