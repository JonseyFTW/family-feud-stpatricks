import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
// These are auto-configured when you connect an Upstash Redis store via Vercel Marketplace
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
