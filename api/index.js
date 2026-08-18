// Vercel serverless entrypoint. Requires `dist/` to exist (built by `npm run build`
// as part of the Vercel build step) since it runs the compiled output, not TS source.
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
