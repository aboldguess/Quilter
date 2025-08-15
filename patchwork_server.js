/**
 * Patchwork Server
 * -----------------
 * Mini README:
 * This Node.js script starts an Express server that serves the Patchwork tile helper
 * web application. It supports configurable ports and a production mode.
 *
 * Structure:
 * - Loads environment variables and command line arguments for configuration.
 * - Sets up Express with Helmet for basic security headers and Pino for logging.
 * - Serves static files from the "public" directory.
 * - Starts the HTTP server on the requested port.
 *
 * Usage:
 *   node patchwork_server.js --port=4000
 *   PORT=4000 node patchwork_server.js
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

// Parse CLI arguments for --port
let port = process.env.PORT || 3000;
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--port=')) {
    const value = parseInt(arg.split('=')[1], 10);
    if (!Number.isNaN(value)) {
      port = value;
    }
  }
}

const app = express();
app.use(helmet());
app.use(pinoHttp({ logger }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  logger.info(`Patchwork helper server running on port ${port}`);
});
