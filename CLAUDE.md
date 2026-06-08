# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gold-Tracker** is a production-ready mini application for tracking gold bar prices and bank availability across Uzbekistan. It scrapes daily data from the Central Bank of Uzbekistan (CBU) website with automatic fallback to mock data if the source becomes unavailable.

- **Demo**: https://frontend-flame-theta-76.vercel.app
- **Data Source**: Central Bank of Uzbekistan (CBU) `https://cbu.uz/ru/banknotes-coins/gold-bars/`
- **Update Schedule**: Daily at 09:00 and 17:00 Tashkent time (UTC+5)

## Architecture Overview

The application follows a standard **monorepo structure** with separate backend and frontend, both containerized.

```
gold-tracker/
├── backend/          # Node.js + Express + TypeScript + SQLite
├── frontend/         # React 18 + Vite + TypeScript + Tailwind CSS
├── docker-compose.yml
└── render.yaml       # Render deployment config (не используется, бэкенд на Railway)
```

### Backend Architecture

**Tech Stack**: Node.js 20 + Express + TypeScript + SQLite (better-sqlite3) + Axios + Cheerio

**Key Components**:

- **Database** (`src/config/database.ts`): SQLite with 5 tables (banks, branches, gold_prices, gold_availability, price_history). Foreign keys enforced, PRAGMA busy_timeout=5000 for concurrent reads.

- **Scraper** (`src/scrapers/cbuScraper.ts`): 
  - Fetches price and availability data from CBU using Axios + Cheerio
  - Uses advanced grid-building algorithm to handle HTML table rowspan/colspan
  - Fallback to realistic mock data if CBU unreachable
  - Bank name parsing: extracts from guillemets «», fallback to control code removal
  - Short name lookup: 25+ known banks (Russian + Latin) in `extractShortName()` map
  - Weights supported: 5g, 10g, 20g, 50g, 100g (configured in `WEIGHT_COLUMNS`)

- **Repository** (`src/repositories/goldRepository.ts`):
  - Upsert operations with `ON CONFLICT` for idempotent updates
  - Bank aggregation: by name only (all cities under one card)
  - Price history: retrieves last 15 days via limit
  - City filtering: removes garbage rows (rows with weight tags via `city NOT LIKE '%гр%'`)
  - `persistScrapedData()`: transactional batch insert for prices + availability

- **Services** (`src/services/goldService.ts`):
  - `refreshData()`: orchestrates scrape → persist → seed history
  - Tracks `lastScrapeTime` and `isMockData` flag for API responses
  - Initial startup: seeds 15 days of synthetic history with ±2% variance if first run
  - `getPrices()`, `getBanksWithAvailability()`, `getPriceHistory()`, `getCities()` expose data

- **Telegram Bot** (`src/services/telegramService.ts`):
  - Daily auto-send at 11:00 Tashkent time (Markdown formatting)
  - Webhook-based: accepts `/start`, `/prices`, `/nalichie` commands
  - City selection via callback buttons; in-memory state (resets on redeploy)
  - Fallback fake phone numbers for demo branches

- **Cron Jobs** (`src/jobs/`):
  - `scrapeJob.ts`: 09:00 and 17:00 Tashkent (04:00 and 12:00 UTC) via node-cron
  - `telegramJob.ts`: daily at 11:00 Tashkent time
  - Timezone: `Asia/Tashkent` hardcoded; override via `CRON_SCHEDULE` env var

- **API Routes** (`src/routes/index.ts`, `src/controllers/goldController.ts`):
  - GET /api/prices, /api/prices/history?weight=N, /api/banks?city=&weight=, /api/cities, /api/status, /health
  - POST /api/refresh (manual trigger), /api/telegram/webhook, /api/telegram/test
  - Error handler: centralized in `src/middleware/errorHandler.ts` (500+ errors logged)

### Frontend Architecture

**Tech Stack**: React 18 + Vite + TypeScript + Tailwind CSS + React Router

**Pages** (`src/pages/`):
- `PricesPage.tsx`: 15-day bar chart + gold card grid. Chart shows min/max labels, hover tooltips, normalized height (30%-90%). Cards show weight, price, trend, "Check Availability" button linking to `/banks?weight=N`
- `BanksPage.tsx`: Weight selector + city dropdown → filtered bank list. Modal displays branches with address, city, quantity, clickable tel: links

**Data Hooks** (`src/hooks/useGoldData.ts`):
- `usePrices()`: fetch all, track updatedAt + isMockData
- `usePriceHistory(weightGrams)`: 15-day history (reactive to weight param)
- `useBanks(city?, weight?)`: fetch filtered, includes refetch() callback
- `useCities()`: fetch cities (non-critical, silent fail)

**API Client** (`src/api/goldApi.ts`): Thin fetch wrapper. Uses `VITE_API_URL` env var or defaults to `/api`.

**UI Components** (10 files, 15-80 LOC each):
- `Header.tsx`: Fixed top bar showing price per gram
- `BottomNav.tsx`: Fixed bottom nav (Prices / Banks)
- `PriceChart.tsx`: Bar chart with tooltips, min/max, x-axis labels
- `BankCard.tsx`: Bank summary (initials in gradient, quantity, branches count, modal button)
- `BranchModal.tsx`: Sheet with branch list (address, city, quantity, tel links)
- `WeightChips.tsx`: Pills for 5g-100g
- `CitySelector.tsx`: Dropdown
- `PriceHero.tsx`, `EmptyState.tsx`, `LoadingSkeleton.tsx`: Supporting

**Styling**: Tailwind with Material 3 tokens (primary=#705d00 gold, secondary grays, emerald success). Custom spacing (unit=8px, gutter=16px, stack-*). Manrope font. Responsive grid (`cols-1 md:cols-2`).

**Build**: Vite with dev proxy `/api` → `localhost:3001`. Output: `dist/`. Nginx in production (gzip, 1y cache for assets, SPA fallback).

## Development Commands

### Backend
```bash
cd backend
npm install                # Install deps
npm run dev               # Development (tsx watch)
npm run build             # Compile to dist/
npm start                 # Run production build
npm run scrape            # One-off scrape (for testing parser)
```

### Frontend
```bash
cd frontend
npm install               # Install deps
npm run dev              # Development (Vite, port 5173, API proxied to 3001)
npm run build            # Build for production
npm preview              # Preview built output
npm run lint             # Type check (no emit)
```

### Docker
```bash
docker-compose up --build           # Build and start
docker-compose up -d --build        # Detached
docker-compose logs -f [service]    # View logs
docker-compose down                 # Stop
docker-compose down -v              # Stop and delete volume
```

## Environment Variables

### Backend (.env)
| Variable      | Default | Purpose |
|---------------|---------|---------|
| PORT          | 3001    | Express server port |
| NODE_ENV      | development | Logging level |
| DATA_DIR      | ./data  | SQLite path (must be writable) |
| CORS_ORIGIN   | http://localhost:5173,http://localhost | Allowed origins (comma-separated) |
| CRON_SCHEDULE | 0 4 * * * | Scrape cron (default: 04:00 UTC = 09:00 Tashkent) |
| TELEGRAM_BOT_TOKEN | (optional) | Telegram bot token |
| TELEGRAM_CHAT_ID | (optional) | Default chat for daily messages |
| RAILWAY_PUBLIC_DOMAIN | (optional) | Used for Telegram webhook registration on Railway |

### Frontend
| Variable | Default | Purpose |
|----------|---------|---------|
| VITE_API_URL | /api | Backend API URL |

## Database Schema

5 tables: `banks` (id, name, short_name), `branches` (id, bank_id, city, address, phone), `gold_prices` (id, weight_grams UNIQUE, price_uzs, updated_at), `gold_availability` (id, branch_id, weight_grams, quantity, price_uzs, updated_at with UNIQUE(branch_id, weight_grams)), `price_history` (id, weight_grams, price_uzs, date with UNIQUE(weight_grams, date)).

**Constraints**: Foreign keys ON, busy_timeout 5000ms, upserts use ON CONFLICT for idempotency.

## Important Implementation Details

### Web Scraping

**HTML Structure**: CBU tables use rowspan/colspan. Solution: `buildGrid()` expands merged cells into logical grid before parsing. Weight columns detected by "5 гр" header. Bank names: regex `«([^»]+)»` (guillemets) or fallback parsing. Quantity: "—" or empty = 0.

**Bank Name Normalization**: `parseBankName()` extracts from guillemets and parentheses. `extractShortName()` uses 25+ bank map (Russian + Latin names). Fallback: first 4 letters uppercase.

**Fallback**: If scrape fails (network, parse, 0 rows), use `getMockData()`. `isMockData` flag passed through API responses.

### Data Initialization & Persistence

1. **First startup**: Tables created (idempotent), `refreshData()` called. If CBU unavailable, mock used with seeded history (±2% variance).
2. **Daily**: Scrapes at 09:00, 17:00 Tashkent. Prices upsert (overwrites), availability upserts (branch+weight key), today's date in history.
3. **Seeding**: Only if weight has no history. Generates 15 entries backwards from today with ±2% variance.

### API Response Format

```typescript
interface ApiResponse<T> {
  data: T;
  updatedAt?: string;        // ISO timestamp
  isMockData?: boolean;      // true if using mock fallback
}
// Errors: { "error": "message" }
```

### Frontend State

- No Redux/Zustand, simple useState + useEffect
- Custom hooks in useGoldData.ts with loading/error states
- URL-based filtering (?weight=N), not component state
- Modal state: controlled by parent
- Telegram bot city pref: in-memory (lost on redeploy)

### Styling System

**Colors**: Material 3 (primary=#705d00 gold, secondary grays, emerald success, error red). **Spacing**: unit=8px, gutter=16px, stack-md/lg=16/32px, container-margin=24px. **Font**: Manrope sans-serif, headline/body/label sizes. **Responsive**: flex + grid-cols-1 md:cols-2, no major layout shifts.

## Deployment

### Docker (VPS)
1. Clone, `docker-compose up -d --build`
2. App at `http://localhost:80`
3. Data persists in volume `gold_data`

### Railway (Backend — текущий деплой)
**URL**: `https://gold-tracker-backend-production.up.railway.app`
**Backend**: Node.js сервис, build: `npm install --include=dev && npm run build`, start: `node dist/index.js`. Envs: PORT, NODE_ENV, CORS_ORIGIN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
**Frontend**: Vercel — `https://frontend-flame-theta-76.vercel.app`, env: `VITE_API_URL=https://gold-tracker-backend-production.up.railway.app/api`.

### Vercel (Frontend)
Connect repo, select `frontend` dir, build: `npm run build`, output: `dist`, set `VITE_API_URL` env var.

## Testing & Debugging

```bash
# Manual scrape test
cd backend && npm run scrape

# Check DB
cd backend/data && sqlite3 gold.db "SELECT * FROM gold_prices;"

# Health check
curl http://localhost:3001/health

# Trigger scrape via API
curl -X POST http://localhost:3001/api/refresh

# Test Telegram
curl -X POST http://localhost:3001/api/telegram/test
```

## Common Modifications

**Add Weight**: Update `WEIGHT_COLUMNS` in scraper, `WEIGHTS` in frontend WeightChips, `WEIGHT_LABELS` in PricesPage if needed.

**Change Scrape Schedule**: Set `CRON_SCHEDULE` env (5-field cron, e.g., `0 9 * * *` for 09:00 UTC daily). Timezone in code: `Asia/Tashkent`.

**Add Bank Short-Name**: Edit `extractShortName()` map in scraper, restart backend.

**Customize Telegram**: Edit functions in telegramService.ts (text, emoji, buttons, formatting).

**Modify Price Chart**: Edit PriceChart.tsx (height range currently 30%-90%, colors, date format).

## Known Limitations

1. **Telegram prefs**: In-memory, lost on redeploy. Consider Redis or DB for persistence.
2. **Phone numbers**: Generated deterministically via `fakePhone()` for demo.
3. **CBU parser**: Relies on CSS structure; website changes break scraper.
4. **No auth**: APIs public (intended for public data).
5. **No analytics**: No usage tracking.
6. **Single server**: No horizontal scaling.

## File Structure

Backend: 157K (src, config, Docker, packages). Frontend: 218K (src, config, Docker, assets). Most files: 60-200 LOC (single responsibility).
