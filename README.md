# 🕵️ Dark Pattern Detector

> **Expose the manipulation. Score the shame. Fix the web.**

A full-stack tool that scans any website or email for deceptive UX dark patterns — hidden unsubscribe buttons, confirm-shaming, fake urgency, invisible opt-out links — and gives it an **Evil Score from 0 to 100**.

![Dark Pattern Detector](https://img.shields.io/badge/Evil%20Score-0--100-red?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-lightgrey?style=for-the-badge)

---

## 🔥 What It Does

You've seen them. Websites that:
- Hide the "Unsubscribe" button in 7px grey text on a white background
- Say *"No thanks, I enjoy losing money"* when you try to cancel
- Pre-tick marketing checkboxes so you opt in without noticing
- Bury the cancel button 4 clicks deep while the "Subscribe" button is front and center

**This tool catches all of it. Automatically.**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Evil Score (0–100)** | Animated gauge with per-category breakdown |
| 🔍 **8 Dark Pattern Detectors** | Low contrast, tiny fonts, hidden elements, confirm-shaming, misleading labels, pre-ticked boxes, fake urgency, footer burial |
| 📸 **Before/After Screenshots** | Side-by-side original vs cleaned view via Puppeteer |
| 📧 **Email Newsletter Scanner** | Paste raw email HTML — first tool to detect dark patterns *inside* emails |
| 🏆 **Hall of Shame Leaderboard** | Community-ranked most manipulative websites |
| 📈 **Evil Score Timeline** | Track how a site's dark patterns change week over week |
| 🔧 **"Fix It For Me"** | Diff view showing the exact HTML changes needed |
| 💼 **LinkedIn Post Generator** | One-click ready-to-post report for sharing findings |
| 🧩 **Chrome Extension** | Real-time Evil Score badge on every page you visit |

---

## 🖥️ Demo

> Try it live or run the demo mode locally (no database needed)

**Sample results from real sites:**

| Website | Evil Score | Worst Pattern |
|---|---|---|
| amazon.com | 🔴 **82/100** | Confirm-shaming on Prime popup |
| linkedin.com | 🟠 **74/100** | Pre-ticked marketing checkboxes |
| booking.com | 🟠 **71/100** | Fake "only 2 rooms left" urgency |
| github.com | 🟢 **8/100** | Nearly clean |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or skip DB for demo mode)

```bash
git clone https://github.com/findsri/dark-pattern-detector.git
cd dark-pattern-detector
npm install
```

### Run with demo data (no database needed)

```bash
# Frontend only — uses built-in demo scan results
cd app
cp .env.example .env.local   # NEXT_PUBLIC_DEMO_MODE=true
npm run dev
# → http://localhost:3000
```

### Run the full stack

```bash
# 1. Set up env
cp api/.env.example api/.env
# Edit api/.env → set DATABASE_URL=postgresql://localhost/darkpatterns

echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > app/.env.local

# 2. Init database + seed demo data
createdb darkpatterns
cd api && npx ts-node src/seed.ts && cd ..

# 3. Build shared detector package
cd packages/detector && npm install && npm run build && cd ../..

# 4. Start everything
npm run dev   # starts both API (4000) and frontend (3000)
```

---

## 🧩 Chrome Extension

1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load Unpacked**
4. Select the `extension/` folder

You'll see an Evil Score badge appear on every website you visit.

---

## 🏗️ Project Structure

```
dark-pattern-detector/
├── app/                        # Next.js 14 + Tailwind frontend
│   ├── src/app/                # Pages (scanner, leaderboard, timeline, email)
│   └── src/components/         # EvilScoreGauge, PatternCard, DiffViewer…
│
├── api/                        # Express + TypeScript backend
│   ├── src/routes/scan.ts      # POST /api/scan
│   ├── src/routes/leaderboard.ts
│   ├── src/db.ts               # PostgreSQL schema
│   └── src/screenshot.ts       # Puppeteer integration
│
├── packages/detector/          # 📦 Shared detection library (importable)
│   ├── src/detectors/          # unsubscribeDetector, generalDarkPatterns
│   ├── src/utils/scoring.ts    # Evil Score algorithm
│   ├── src/linkedInGenerator.ts
│   └── src/fixGenerator.ts     # HTML diff + auto-fix
│
└── extension/                  # Chrome Manifest V3
    ├── background.js            # Service worker + badge updates
    ├── content.js               # Page scanner + injected badge
    └── popup.html/js            # Extension popup UI
```

---

## 🔌 API Reference

### `POST /api/scan`

```json
{
  "url": "https://example.com",
  "html": "<html>…</html>",
  "isEmail": false,
  "takeScreenshot": false
}
```

**Response:**
```json
{
  "scanId": "uuid",
  "evilScore": 74,
  "totalPatterns": 9,
  "scoreBreakdown": { "low_contrast": 18, "confirm_shaming": 16, … },
  "patterns": [ { "category": "confirm_shaming", "severity": "high", … } ],
  "linkedInPost": "🚫 I scanned linkedin.com and found 9 dark patterns…",
  "diff": [ { "original": "…", "fixed": "…", "description": "…" } ]
}
```

| Endpoint | Description |
|---|---|
| `POST /api/scan` | Scan a URL or HTML |
| `GET /api/scan/:id` | Retrieve a past scan |
| `GET /api/leaderboard` | Hall of Shame top 50 |
| `GET /api/leaderboard/timeline/:domain` | Score history for a domain |
| `GET /api/leaderboard/recent` | Recent public scans |

---

## 🧠 How the Evil Score Works

Each detected pattern adds weighted points to a category bucket (capped per category). The total is normalized to 0–100.

| Category | Max Points | What triggers it |
|---|---|---|
| Low Contrast | 25 | Contrast ratio < 4.5:1 on opt-out elements |
| Hidden Element | 20 | `display:none` / `visibility:hidden` on unsubscribe |
| Confirm Shaming | 20 | "No thanks, I enjoy losing money" language |
| Opacity Hidden | 20 | Opacity < 0.3 on opt-out elements |
| Off-Screen | 20 | Absolute positioned far off-screen |
| Misleading Label | 15 | Pre-ticked checkboxes, vague "click here" labels |
| Tiny Font | 15 | Font size < 10px on opt-out text |
| Buried in Footer | 10 | Unsubscribe only exists in `<footer>` |
| No Link Styling | 10 | `text-decoration:none` making links invisible |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) · Tailwind CSS · Framer Motion · Recharts
- **Backend**: Express · TypeScript · Zod · express-rate-limit
- **Detection**: Cheerio · wcag-contrast
- **Screenshots**: Puppeteer
- **Database**: PostgreSQL
- **Extension**: Chrome Manifest V3 (vanilla JS, no build step)

---

## ☁️ Deployment

**Frontend → Vercel**
```bash
cd app && vercel deploy
```

**Backend + DB → Railway**
1. Connect this repo to [Railway](https://railway.app)
2. Add a PostgreSQL plugin
3. Set `DATABASE_URL` from the plugin
4. Set root to `api/` → deploy

---

## 🤝 Contributing

Found a dark pattern this tool misses? Open an issue or PR.
Ideas for new detection rules are especially welcome.

---

## 📄 License

© 2025 Srilekha. All rights reserved.

---

<div align="center">
  <strong>Built to make the web a little less manipulative.</strong><br/>
  <sub>If this helped you, star the repo ⭐ and share it.</sub>
</div>
