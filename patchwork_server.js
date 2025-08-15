/**
 * Patchwork Server
 * -----------------
 * Mini README:
 * This Node.js script starts an Express server that serves the Patchwork tile helper
 * web application. It supports configurable host/port and a production mode.
 *
 * Structure:
 * - Loads environment variables and command line arguments for configuration.
 * - Sets up Express with Helmet for basic security headers and Pino for logging.
 * - Serves static files from the "public" directory.
 * - Starts the HTTP server on the requested host and port.
 *
 * Usage:
 *   node patchwork_server.js --port=4000 --host=0.0.0.0
 *   PORT=4000 HOST=0.0.0.0 node patchwork_server.js
 *   NODE_ENV=production node patchwork_server.js
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');
require('dotenv').config();

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Parse CLI arguments for --port and --host
let port = parseInt(process.env.PORT, 10) || 3000;
let host = process.env.HOST || '0.0.0.0';
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--port' && args[i + 1]) {
    const value = parseInt(args[i + 1], 10);
    if (!Number.isNaN(value)) {
      port = value;
    }
    i += 1;
  } else if (arg.startsWith('--port=')) {
    const value = parseInt(arg.split('=')[1], 10);
    if (!Number.isNaN(value)) {
      port = value;
    }
  } else if (arg === '--host' && args[i + 1]) {
    host = args[i + 1];
    i += 1;
  } else if (arg.startsWith('--host=')) {
    host = arg.split('=')[1];
  }
}

const app = express();
app.use(helmet());
app.use(pinoHttp({ logger }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, host, () => {
  logger.info(`Patchwork helper server running at http://${host}:${port}`);
});
