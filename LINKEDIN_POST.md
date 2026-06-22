# LinkedIn Post — Copy & Paste This

---

🕵️ I built a tool that gives websites an "Evil Score" for their manipulative UX.

Amazon scored **82/100**. LinkedIn scored **74/100**.

Here's what I found 👇

---

Companies spend millions hiring UX designers — not to make your life easier, but to make it harder to leave.

A few things they do that most people never notice:

🔴 Hide the "Unsubscribe" button in **7px grey text** on a white background (contrast ratio: 1.8:1 — WCAG requires 4.5:1)

🔴 Write decline buttons as **"No thanks, I enjoy paying full price"** — so you feel stupid for saying no

🔴 Pre-tick the **"Keep me subscribed to partner promotions"** checkbox — so you opt in without realising

🔴 Put the cancel button **4 clicks deep** while the "Subscribe" button is one click on the homepage

This is called **dark patterns** — and it's everywhere.

---

So I built the **Dark Pattern Detector**.

You paste a URL. It scans the page and gives it an Evil Score from 0 to 100, based on 8 categories of manipulative UX.

It also:
✅ Shows you the exact HTML that's causing the problem
✅ Generates a fixed version with a diff view
✅ Tracks how sites change over time (getting worse or better?)
✅ Works on email newsletters too — not just websites
✅ Has a Chrome extension that shows the score on every page you visit

---

**The Hall of Shame leaderboard so far:**

🔴 amazon.com — 82
🟠 linkedin.com — 74
🟠 booking.com — 71
🟠 ticketmaster.com — 68
🟢 github.com — 8

---

The entire codebase is open on GitHub.

Built with Next.js 14, TypeScript, Cheerio, Puppeteer, and PostgreSQL.

👉 **GitHub**: https://github.com/findsri/dark-pattern-detector

Would love your feedback — drop a comment with a site you think should be on the Hall of Shame 👇

---

#DarkPatterns #UX #Ethics #WebDesign #OpenSource #JavaScript #NextJS #Accessibility #ProductDesign #AI

---

## Screenshot checklist before posting:

Take screenshots of these 3 things to attach to the post:

1. **The landing page** (scanner with the URL input)
2. **Amazon scan results** — the Evil Score gauge at 82 showing the red arc
3. **Hall of Shame leaderboard** — the ranked table

The more visual the post, the more it spreads. Attach all 3 images.
