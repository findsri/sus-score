# Dark Pattern Detector

A full-stack web app that scans websites and emails for deceptive UX patterns, scores them on a 0–100 "Evil Score", and generates actionable reports.

## Features

- **Evil Score Gauge** — animated 0–100 score with category breakdown
- **Dark Pattern Detection** — low contrast, tiny fonts, hidden elements, confirm-shaming, misleading labels, pre-ticked boxes, fake urgency
- **Before/After Screenshots** — side-by-side original vs cleaned view (via Puppeteer)
- **Email Newsletter Scanner** — paste raw email HTML to detect patterns inside emails
- **Hall of Shame** — community leaderboard of most manipulative sites
- **Timeline Tracking** — chart a website's Evil Score over time
- **"Fix It For Me"** — diff view showing exactly what to change
- **LinkedIn Post Generator** — ready-to-post scan report
- **Chrome Extension** — real-time Evil Score badge on every page

## Project Structure

```
dark-pattern-detector/
├── app/                    # Next.js 14 frontend
├── api/                    # Express backend + scanner engine
├── packages/detector/      # Shared detection library
├── extension/              # Chrome/Firefox extension
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or use Railway/Supabase)
- npm 9+

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
# API
cp api/.env.example api/.env
# Edit api/.env — set DATABASE_URL

# Frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > app/.env.local
```

### 3. Initialize the database

```bash
# Start PostgreSQL and create the database
createdb darkpatterns

# Run migrations (auto-runs on server start)
# Or seed demo data:
cd api && npx ts-node src/seed.ts
```

### 4. Build the shared detector package

```bash
cd packages/detector && npm install && npm run build
```

### 5. Start the API server

```bash
cd api && npm install && npm run dev
# Runs on http://localhost:4000
```

### 6. Start the frontend

```bash
cd app && npm install && npm run dev
# Runs on http://localhost:3000
```

## Chrome Extension

1. Go to `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked**
4. Select the `extension/` folder

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Scan a URL or HTML |
| GET | `/api/scan/:id` | Get scan by ID |
| GET | `/api/leaderboard` | Hall of Shame top 50 |
| GET | `/api/leaderboard/timeline/:domain` | Timeline for domain |
| GET | `/api/leaderboard/recent` | Recent public scans |

### POST /api/scan

```json
{
  "url": "https://example.com",
  "html": "<html>...</html>",
  "isEmail": false,
  "takeScreenshot": false
}
```

Either `url` or `html` is required.

## Detected Dark Patterns

| Category | Description | Severity |
|----------|-------------|----------|
| `low_contrast` | Unsubscribe links with < 4.5:1 contrast ratio | medium–critical |
| `tiny_font` | Opt-out text below 10px | high–critical |
| `hidden_element` | display:none / visibility:hidden on unsubscribe | critical |
| `no_styling` | Unsubscribe links with text-decoration:none | medium |
| `opacity_hidden` | Opacity < 0.3 on opt-out elements | high–critical |
| `buried_in_footer` | Unsubscribe link only in footer | medium |
| `misleading_label` | Vague labels like "click here to stop receiving" | medium |
| `confirm_shaming` | "No thanks, I enjoy losing money" language | high |

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS + Framer Motion + Recharts
- **Backend**: Express + TypeScript + Zod validation
- **Detection**: Cheerio (HTML parsing) + wcag-contrast
- **Screenshots**: Puppeteer
- **Database**: PostgreSQL
- **Extension**: Manifest V3 (vanilla JS)

## Deployment

### Frontend → Vercel
```bash
cd app && vercel deploy
```

### Backend → Railway
1. Connect GitHub repo to Railway
2. Set root directory to `api/`
3. Add `DATABASE_URL` environment variable
4. Deploy

### Database → Railway PostgreSQL
Add a PostgreSQL plugin to your Railway project and copy the `DATABASE_URL`.

## Sample Scan Results

The seed script populates demo data for:
- **amazon.com** — Evil Score: 82 (confirm-shaming, low contrast, pre-ticked boxes)
- **linkedin.com** — Evil Score: 74 (dark nudges, misleading labels)
- **github.com** — Evil Score: 8 (mostly clean)
- Sample newsletter email with 7 dark patterns

## License

MIT
