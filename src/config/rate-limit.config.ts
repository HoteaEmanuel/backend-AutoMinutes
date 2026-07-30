import { registerAs } from '@nestjs/config';

export default registerAs('rateLimit', () => ({
  trustProxy: process.env.TRUST_PROXY === 'true',
  ttl: Number(process.env.THROTTLE_TTL ?? 60000),
  limit: Number(process.env.THROTTLE_LIMIT ?? 120),
}));
