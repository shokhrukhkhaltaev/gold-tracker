# Золото Узбекистана — Gold Price Tracker

A production-ready mini app for tracking gold bar prices and bank availability across Uzbekistan. Data is scraped daily from the Central Bank of Uzbekistan (CBU) website with automatic fallback to realistic mock data if the source is unavailable.

## Screenshots

- **Prices page**: 15-day price history chart + all available bar weights
- **Banks page**: Filterable list of banks with gold availability by city/weight + branch details modal with click-to-call

---

## Tech Stack

| Layer     | Tech                                      |
|-----------|-------------------------------------------|
| Frontend  | React 18 + Vite + TypeScript + Tailwind   |
| Backend   | Node.js + Express + TypeScript            |
| Database  | SQLite (via `better-sqlite3`)             |
| Scraping  | Axios + Cheerio                           |
| Scheduler | node-cron (daily at 09:00 Tashkent time)  |
| Deploy    | Docker + docker-compose                   |

---

## Project Structure

```
gold-tracker/
├── backend/
│   ├── src/
│   │   ├── config/       # Database setup
│   │   ├── controllers/  # HTTP handlers
│   │   ├── jobs/         # Cron job
│   │   ├── middleware/   # Error handling
│   │   ├── repositories/ # SQLite queries
│   │   ├── routes/       # Express routes
│   │   ├── scrapers/     # CBU scraper + mock data
│   │   ├── services/     # Business logic
│   │   ├── types/        # Shared TypeScript types
│   │   ├── app.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Data-fetching hooks
│   │   ├── pages/        # PricesPage, BanksPage
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Clone and set up

```bash
git clone <repo-url>
cd gold-tracker
cp .env.example backend/.env
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

The backend starts at `http://localhost:3001`. On first run it will:
- Initialize the SQLite database
- Scrape CBU (falls back to mock data if unavailable)
- Seed 15-day price history
- Schedule daily cron job

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running with Docker

### Build and start everything

```bash
docker-compose up --build
```

The app will be available at `http://localhost`.

### Stop

```bash
docker-compose down
```

### Persistent data

Gold data is stored in a named Docker volume `gold_data`. To reset:

```bash
docker-compose down -v
```

---

## API Reference

Base URL: `http://localhost:3001/api`

| Method | Endpoint               | Description                                    |
|--------|------------------------|------------------------------------------------|
| GET    | `/prices`              | All gold prices by weight                      |
| GET    | `/prices/history`      | 15-day price history (`?weight=1`)             |
| GET    | `/banks`               | Banks with availability (`?city=&weight=`)     |
| GET    | `/cities`              | List of all cities                             |
| GET    | `/status`              | Scraper status + last update time              |
| POST   | `/refresh`             | Trigger manual data refresh                    |
| GET    | `/health`              | Health check                                   |

### Example responses

**GET /api/prices**
```json
{
  "data": [
    { "weightGrams": 1, "priceUzs": 980000, "updatedAt": "2024-04-30T09:00:00Z" },
    { "weightGrams": 5, "priceUzs": 4900000, "updatedAt": "2024-04-30T09:00:00Z" }
  ],
  "updatedAt": "2024-04-30T09:00:00Z",
  "isMockData": false
}
```

**GET /api/banks?city=Ташкент&weight=5**
```json
{
  "data": [
    {
      "bankName": "Hamkorbank",
      "bankShortName": "HKB",
      "city": "Ташкент",
      "totalQuantity": 25,
      "hasAvailability": true,
      "branches": [
        {
          "branchId": 1,
          "address": "пр. Буюк Ипак Йули, 65",
          "phone": "+998712339000",
          "quantity": 22,
          "available": true
        }
      ]
    }
  ],
  "updatedAt": "2024-04-30T09:00:00Z",
  "isMockData": false
}
```

---

## Deployment

### Railway / Render

1. Push to GitHub
2. Connect repo to Railway or Render
3. Deploy backend as a Node.js service with `npm install && npm run build && npm start`
4. Set env vars from `.env.example`
5. Deploy frontend as a static site with `npm run build` → output dir `dist`
   - Set `VITE_API_URL` env var if backend is on a different domain and update `vite.config.ts` proxy accordingly

### VPS (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone <repo-url> /opt/gold-tracker
cd /opt/gold-tracker

# Start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## Data Source

Gold bar prices and availability are scraped from the Central Bank of Uzbekistan:
`https://cbu.uz/ru/banknotes-coins/gold-bars/balance/`

Data updates at 09:00 Tashkent time daily. If the CBU website is unavailable, the app serves cached data from the last successful scrape. On first startup with no prior data, realistic mock data is used.

---

## Manual Scrape Trigger

```bash
# From backend directory
npm run scrape

# Or via API
curl -X POST http://localhost:3001/api/refresh
```
