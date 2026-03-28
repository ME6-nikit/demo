# OMA Electron App

Electron desktop application for printer detection, print job polling, and automated printing.

## Setup

```bash
cd electron
npm install
npm start
```

For development with the React frontend:

```bash
npm run dev
```

## Features

- **Printer Detection:** Automatically detects local printers using Electron's `webContents.getPrinters()`
- **Printer Sync:** Syncs detected printers to the OMA backend (`POST /api/printers/sync`)
- **Print Job Polling:** Polls the backend for pending print jobs assigned to this machine
- **Auto-Print:** Picks up pending jobs, sends them to the assigned printer, and reports status back
- **Machine ID:** Generates and persists a unique machine identifier for printer-machine association

## Architecture

```
electron/
├── src/
│   ├── main.js            # Electron main process entry
│   ├── preload.js         # Context bridge for renderer
│   ├── config.js          # Machine ID + backend URL config
│   └── printerService.js  # Printer detection, sync, job polling
├── package.json
└── README.md
```

## Configuration

Set `OMA_BACKEND_URL` environment variable to point to the backend (defaults to `http://localhost:3000`).
