# Quilter Patchwork Helper

This repository contains a mobile-friendly web application for evaluating Patchwork board game tiles. Users can draw custom pieces, compute their efficiency, and remove purchased tiles.

## Features
- Responsive interface designed for phones
- Slider to set the current payday (1–9)
- Draw shapes on a 5×5 grid and assign buttons, cost, and time penalty
- Choose a color for each piece
- Calculates current value, value per time penalty, and value per time penalty per area
- Persistent piece library with edit and delete options
- Purchased tiles move to a separate page and reappear after starting a new game
- Purchased page displays purchase-time value and efficiency metrics with a mobile-friendly column selector
- Sortable table to order pieces by any stat
- Server uses Express with Helmet and Pino for security and logging
- Configurable host/port and production mode

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

## Debugging
- Server logs are written to stdout using Pino.
- Client logs are available in the browser console.

## Testing & Linting
```bash
npm test   # currently prints 'No tests'
npm run lint
```
