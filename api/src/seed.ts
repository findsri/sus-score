/**
 * Seed script — populates Hall of Shame and demo scan results.
 * Run: npx ts-node src/seed.ts
 */
import { pool, initDb, upsertHallOfShame, insertTimelineScan } from './db';
import { v4 as uuidv4 } from 'uuid';

const SEED_DOMAINS = [
  { domain: 'amazon.com', scores: [70, 74, 78, 79, 82, 82] },
  { domain: 'linkedin.com', scores: [60, 65, 68, 72, 74, 74] },
  { domain: 'booking.com', scores: [55, 60, 64, 68, 71, 71] },
  { domain: 'ticketmaster.com', scores: [50, 55, 60, 65, 68, 68] },
  { domain: 'tripadvisor.com', scores: [45, 50, 55, 60, 64, 64] },
  { domain: 'hotels.com', scores: [40, 48, 52, 57, 61, 61] },
  { domain: 'quora.com', scores: [30, 38, 42, 48, 52, 55] },
  { domain: 'forbes.com', scores: [35, 40, 44, 47, 49, 49] },
  { domain: 'reddit.com', scores: [20, 22, 21, 23, 23, 23] },
  { domain: 'github.com', scores: [10, 9, 8, 7, 8, 8] },
];

// Sample scan for Amazon (demo patterns)
const AMAZON_SCAN = {
  id: uuidv4(),
  url: 'https://amazon.com',
  evil_score: 82,
  total_patterns: 11,
  score_breakdown: {
    low_contrast: 18,
    tiny_font: 10,
    hidden_element: 15,
    no_styling: 8,
    off_screen: 0,
    misleading_label: 15,
    confirm_shaming: 16,
    buried_in_footer: 8,
    opacity_hidden: 0,
  },
  patterns: [
    {
      id: uuidv4(),
      category: 'confirm_shaming',
      severity: 'high',
      description: '"No thanks, I enjoy paying full price" decline button on Prime popup',
      element: '<a href="#" style="font-size: 11px; color: #aaa;">No thanks, I enjoy paying full price</a>',
      selector: 'a',
      details: { text: 'No thanks, I enjoy paying full price' },
      fixSuggestion: 'Replace with neutral "No thanks" or "Not now"',
    },
    {
      id: uuidv4(),
      category: 'low_contrast',
      severity: 'high',
      description: 'Unsubscribe link has contrast ratio of 1.8:1 (WCAG requires 4.5:1)',
      element: '<a href="/unsubscribe" style="color: #aaaaaa; background: #ffffff; font-size: 10px;">Unsubscribe</a>',
      selector: 'a',
      details: { contrastRatio: 1.8, color: '#aaaaaa', background: '#ffffff' },
      fixSuggestion: 'Increase contrast to at least 4.5:1',
    },
    {
      id: uuidv4(),
      category: 'misleading_label',
      severity: 'medium',
      description: 'Pre-ticked "Keep me subscribed to Deals" checkbox in account settings',
      element: '<input type="checkbox" checked name="marketing"> Keep me subscribed to Deals & Offers',
      selector: 'input[type="checkbox"][checked]',
      details: { label: 'Keep me subscribed to Deals & Offers' },
      fixSuggestion: 'Opt-in checkboxes must be unchecked by default (GDPR requirement)',
    },
  ],
  linkedin_post: `🚫 I scanned amazon.com and found 11 dark patterns. Here's what they don't want you to see 👇\n\n🎯 Evil Score: 82/100\n████████░░ 82%\n\nTop dark patterns found:\n\n1. 🚨 Confirm-Shaming Language\n   "No thanks, I enjoy paying full price" decline button\n\n2. ⚠️ Low Contrast Unsubscribe Link\n   Contrast ratio of 1.8:1 (needs 4.5:1)\n\n3. 🟡 Misleading Label / Trick Question\n   Pre-ticked marketing checkbox\n\n👉 Try the scanner yourself: https://darkpatterndetector.app\n\n#DarkPatterns #UX #Ethics #WebDesign #AI`,
  is_email: false,
};

// Sample email newsletter scan
const NEWSLETTER_SCAN = {
  id: uuidv4(),
  url: null,
  evil_score: 71,
  total_patterns: 7,
  score_breakdown: {
    low_contrast: 20,
    tiny_font: 15,
    hidden_element: 0,
    no_styling: 8,
    off_screen: 0,
    misleading_label: 12,
    confirm_shaming: 16,
    buried_in_footer: 10,
    opacity_hidden: 0,
  },
  patterns: [],
  linkedin_post: null,
  is_email: true,
};

async function seed() {
  await initDb();

  // Insert sample scans
  for (const scanData of [AMAZON_SCAN, NEWSLETTER_SCAN]) {
    await pool.query(`
      INSERT INTO scans (id, url, evil_score, total_patterns, score_breakdown, patterns, linkedin_post, is_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      scanData.id,
      scanData.url,
      scanData.evil_score,
      scanData.total_patterns,
      JSON.stringify(scanData.score_breakdown),
      JSON.stringify(scanData.patterns ?? []),
      scanData.linkedin_post,
      scanData.is_email,
    ]);
  }

  // Seed Hall of Shame and timeline
  for (const { domain, scores } of SEED_DOMAINS) {
    // Current state
    const latest = scores[scores.length - 1];
    await upsertHallOfShame(domain, latest);

    // Timeline entries
    const baseDate = new Date('2024-01-15');
    for (let i = 0; i < scores.length; i++) {
      const date = new Date(baseDate);
      date.setMonth(baseDate.getMonth() + i);
      await pool.query(`
        INSERT INTO timeline_scans (domain, evil_score, total_patterns, scanned_at)
        VALUES ($1, $2, $3, $4)
      `, [domain, scores[i], Math.round(scores[i] / 8), date.toISOString()]);
    }
  }

  console.log('✅ Seed data inserted successfully');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
