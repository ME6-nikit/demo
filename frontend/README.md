# OMA Frontend (React 17)

React 17 frontend for the Order Management Automation system.

## Setup

```bash
cd frontend
npm install
npm start
```

The dev server starts on `http://localhost:3001` and proxies API requests to the backend at `http://localhost:3000`.

## Features (Planned)

- Order dashboard with department-wise status indicators
- Color-coded status badges (NA=Grey, PENDING=Orange, IN-PROGRESS=Blue, SUCCESS=Green, FAILED=Red)
- Order detail view with timeline
- Printer assignment management
- Print job retry functionality
- PDF download per department
