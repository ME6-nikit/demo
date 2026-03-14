# OMA Desktop (Electron Latest)

## Run locally

1. Install:
   ```bash
   npm install
   ```
2. Start:
   ```bash
   API_BASE_URL=http://localhost:4000 npm start
   ```

What it does:
- Detects local printers via Electron APIs
- Syncs printers to backend every 5 seconds
- Posts printer statuses
- Polls print jobs every 5 seconds (`POST /api/print-job`)
- Prints job PDFs to assigned local printer
- Reports success/failure (`POST /api/print-job/status`)
