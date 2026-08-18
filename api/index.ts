// Vercel serverless entrypoint, built directly from TS source by @vercel/node's Node.js
// Runtime (see vercel.json's "builds" config) - deliberately bypasses Vercel's zero-config
// framework detection and build/output-directory checks, which repeatedly mis-handled
// this project (broken alias resolution, "no exports found", missing output directory).
import { createApp } from '../src/create-app';

let cachedHandler: ((req: unknown, res: unknown) => void) | undefined;

async function getHandler() {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  return cachedHandler;
}

export default async function handler(req: unknown, res: unknown) {
  const h = await getHandler();
  h!(req, res);
}
