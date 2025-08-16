# Quilter Patchwork Helper

This repository contains a mobile-friendly web application for evaluating Patchwork board game tiles. Users can draw custom pieces, compute their efficiency, and remove purchased tiles.

## Features
- Responsive interface designed for phones
- Slider to set the current payday (1–9)
- Draw shapes on a 5×5 grid and assign buttons, cost, and time penalty
- Choose a color for each piece
- Calculates gross score, net score, net score per time penalty, and net score per time penalty per area
- Persistent piece library with edit and delete options
- Export and import the piece library as JSON files
- Purchased tiles move to a separate page and reappear after starting a new game
- Purchased page displays purchase-time gross/net scores and efficiency metrics with a mobile-friendly column selector
- Track yellow and green player purchases with dedicated buy buttons and running scores (sum of purchased net values minus 162)
- Purchased page records buttons on hand and assigns the 7-point bonus, automatically adding these to running scores
- Sortable table to order pieces by any stat
- Shared state stored server-side so multiple clients see the same tiles and purchases
- Server uses Express with Helmet and Pino for security and logging
- Configurable host/port and production mode

## Server-side Persistence
State is shared across all clients and stored in a SQLite database.

- The server creates `data/patchwork.db` on first run.
- `GET /api/state` returns the current `nextId`, `pieceLibrary`,
  `purchasedPieces`, `yellowButtons`, `greenButtons` and `bonusWinner`.
- `POST /api/state` accepts a JSON body with the same fields and saves them to
  the database. A `gameId` query or body value can be supplied to maintain
  separate games; the default is game `1`.

Removing the database file resets the application to a clean slate on the next
server start.

## Setup
### Linux / Raspberry Pi
```bash
# Clone repository then:
cd Quilter
bash scripts/setup_patchwork_env.sh
```

### Windows (PowerShell)
```powershell
cd Quilter
powershell -ExecutionPolicy Bypass -File scripts/setup_patchwork_env.ps1
```

## Usage
Run the server on the desired host and port:
```bash
# Development
npm run dev --port 4000 --host 0.0.0.0
# Production
npm start --port 8080 --host 0.0.0.0
# Alternatively use environment variables
PORT=5000 HOST=0.0.0.0 npm start
```
Then open `http://HOST:PORT` in a browser from any device on the network.
Use the on-screen **Export Library** and **Import Library** buttons to back up or restore pieces.

## Debugging
- Server logs are written to stdout using Pino.
- Client logs are available in the browser console.

## Testing & Linting
```bash
npm test   # currently prints 'No tests'
npm run lint
```
