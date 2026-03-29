# Agro Processing and Value Chain — Frontend

React-based dashboard for the Agro Processing & Value Chain project. Connects to the FastAPI backend to display warehouse batch predictions, alerts, savings analysis and analytics.

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Alert summary, ₹ savings, ethical score, charts |
| Batch Monitor | `/batches` | All batches ranked by expiry with filters |
| Analytics | `/analytics` | Charts — loss by category, action distribution, expiry histogram |
| Predict | `/predict` | Form to predict expiry for a new batch in real time |

---

## Tech Stack

- React 18
- React Router DOM — page navigation
- Recharts — data visualization
- Tailwind CSS — styling
- Fetch API — FastAPI communication

---

## Prerequisites

- Node.js 16+
- FastAPI backend running on `http://localhost:8000`

---

## Setup

### 1. Install dependencies
```bash
npm install
npm install react-router-dom recharts
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

### 2. Start the app
```bash
npm start
```

Opens at `http://localhost:3000`

---

## Folder Structure

```
src/
├── App.jsx                  ← routing
├── index.css                ← Tailwind imports
├── api/
│   └── index.js             ← all API calls to FastAPI
├── components/
│   └── Navbar.jsx           ← sidebar navigation
└── pages/
    ├── Dashboard.jsx        ← homepage with summary stats
    ├── Batches.jsx          ← ranked batch list
    ├── Analytics.jsx        ← charts and breakdown
    └── Predict.jsx          ← new batch prediction form
```

---

## API Connection

All API calls go to `http://localhost:8000`. Configured in `src/api/index.js`.

Make sure the FastAPI backend is running before starting the frontend. See `../agro_api/README.md` for backend setup.

---

## Features

- Real-time expiry predictions via FastAPI
- Alert classification — Critical / Warning / Safe
- Suggested actions — Priority Delivery / Charity / Discard / Monitor
- Financial impact in ₹ — potential loss, recoverable revenue, net saving
- Ethical score based on charity vs discard ratio
- Category and alert level filters on batch list
- Charts — alert distribution, loss by category, expiry histogram, action breakdown
