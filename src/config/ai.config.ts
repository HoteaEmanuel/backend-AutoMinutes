import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
}));
