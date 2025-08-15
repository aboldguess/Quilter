# Quilter Patchwork Helper

This repository contains a mobile-friendly web application for evaluating Patchwork board game tiles. Users can draw custom pieces, compute their efficiency, and remove purchased tiles.

## Features
- Responsive interface designed for phones
- Slider to set the current game age
- Draw shapes on a 5×5 grid and assign buttons, cost, and time penalty
- Choose a color for each piece
- Calculates points per cost, points per cost per area, and net points
- Persistent piece library with edit and delete options
- Purchased tiles move to a separate page and reappear after starting a new game
- Server uses Express with Helmet and Pino for security and logging
- Configurable port and production mode

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
Run the server on the desired port:
```bash
# Development
npm run dev -- --port=4000
# Production
NODE_ENV=production npm run start -- --port=8080
```
Then open `http://localhost:PORT` in a browser.

## Debugging
- Server logs are written to stdout using Pino.
- Client logs are available in the browser console.

## Testing & Linting
```bash
npm test   # currently prints 'No tests'
npm run lint
```
