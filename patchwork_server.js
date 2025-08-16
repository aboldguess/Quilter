/**
 * Patchwork Server
 * -----------------
 * Mini README:
 * This Node.js script starts an Express server that serves the Patchwork tile helper
 * web application. It supports configurable host/port and a production mode.
 * Command line options or NPM-style `--port` and `--host` switches can override defaults.
 *
 * Structure:
 * - Loads environment variables and command line arguments for configuration.
 * - Sets up Express with Helmet for basic security headers and a permissive
 *   cross-origin resource policy so CSS/JS load when accessed via IP, plus Pino
 *   for logging.
 * - Maintains a shared piece/purchase state on disk for all clients.
 * - Exposes `/api/state` for clients to read and update this state,
 *   including buttons on hand for each player and the 7-point bonus holder.
 * - Serves static files from the "public" directory.
 * - Starts the HTTP server on the requested host and port.
 *
 * Usage:
 *   node patchwork_server.js --port=4000 --host=0.0.0.0
 *   PORT=4000 HOST=0.0.0.0 node patchwork_server.js
 *   npm start --port 4000 --host 0.0.0.0
 *   NODE_ENV=production node patchwork_server.js
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');
require('dotenv').config();

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

// Resolve port/host from environment variables first. NPM passes CLI switches as
// npm_config_* variables when invoked like `npm start --port 4000`.
let port = parseInt(process.env.PORT || process.env.npm_config_port, 10);
if (Number.isNaN(port)) {
  port = 3000;
}
// Host resolution needs to guard against NPM's run-script behaviour where
// specifying `--host` without an equals sign results in `npm_config_host=true`.
// Treat "true"/"false" as unset so we can fall back to a sensible default.
let hostEnv = process.env.HOST || process.env.npm_config_host;
let host = hostEnv && hostEnv !== 'true' && hostEnv !== 'false'
  ? hostEnv
  : '0.0.0.0';

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
  } else if (/^\d+$/.test(arg)) {
    // Support bare numeric argument from `npm start --port 4000`
    port = parseInt(arg, 10);
  } else if (!arg.startsWith('--')) {
    // Allow unflagged host argument from `npm run dev --port 4000 --host 0.0.0.0`
    host = arg;
  }
}

// Helpful debug log of the resolved configuration
logger.debug(`Resolved configuration host=${host} port=${port}`);

const app = express();
// Allow assets to load when the site is accessed via its network IP by
// permitting cross-origin resource sharing for static files.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '100kb' }));

// --- Persistent game state handling ---------------------------------------
// Load existing state from disk or initialise defaults if the file is absent.
// State tracks piece data, purchased history, buttons on hand and which
// player (if any) earned the 7-point bonus.
const dataDir = path.join(__dirname, 'data');
const stateFile = path.join(dataDir, 'patchwork_state.json');
let state;
try {
  const raw = fs.readFileSync(stateFile, 'utf8');
  state = JSON.parse(raw);
  logger.debug('Loaded persisted state from disk');
  if (state.yellowButtons === undefined) state.yellowButtons = 0;
  if (state.greenButtons === undefined) state.greenButtons = 0;
  if (!state.bonusWinner) state.bonusWinner = 'none';
} catch (err) {
  logger.warn('No existing state, creating default');
  state = {
    nextId: 1,
    pieceLibrary: [],
    purchasedPieces: [],
    yellowButtons: 0,
    greenButtons: 0,
    bonusWinner: 'none'
  };
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Expose REST endpoints for clients to fetch and update the shared state.
app.get('/api/state', (req, res) => {
  res.json(state);
});

app.post('/api/state', (req, res) => {
  if (req.body && typeof req.body === 'object') {
    state = {
      nextId: req.body.nextId || 1,
      pieceLibrary: req.body.pieceLibrary || [],
      purchasedPieces: req.body.purchasedPieces || [],
      yellowButtons: req.body.yellowButtons || 0,
      greenButtons: req.body.greenButtons || 0,
      bonusWinner: req.body.bonusWinner || 'none'
    };
    try {
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
      res.json({ status: 'ok' });
    } catch (err) {
      logger.error({ err }, 'Failed to write state to disk');
      res.status(500).json({ error: 'Failed to persist state' });
    }
  } else {
    res.status(400).json({ error: 'Invalid state payload' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, host, () => {
  logger.info(`Patchwork helper server running at http://${host}:${port}`);
});
