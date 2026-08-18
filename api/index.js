// Vercel serverless entrypoint. Requires `dist/` to exist (built by `npm run build`
// as part of the Vercel build step) since it runs the compiled output, not TS source.
// vercel.json sets "framework": null so Vercel's own Nest.js zero-config detection
// (which has repeatedly mis-wrapped this app) is skipped entirely in favor of this.
const { createApp } = require('../dist/create-app');

let cachedHandler;

async function getHandler() {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    cachedHandler = app.getHttpAdapter().getInstance();
  }
  return cachedHandler;
}

module.exports = async (req, res) => {
  const handler = await getHandler();
  handler(req, res);
};
