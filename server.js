const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Empêcher le process de mourir silencieusement
process.on('uncaughtException', (err) => {
  console.error('[Nimble] Uncaught exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('[Nimble] Unhandled rejection:', err);
});

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    try {
      handle(req, res, parse(req.url, true));
    } catch (err) {
      console.error('[Nimble] Request error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(process.env.PORT || 3000, () => {
    console.log('[Nimble] Ready on port', process.env.PORT || 3000);
  });
});
