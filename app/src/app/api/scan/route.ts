import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

// ── Inline detector (no external API needed) ──────────────────────────────────
// We re-implement the core detection logic here so the Next.js app works
// fully standalone without the Express backend.

type PatternCategory =
  | 'low_contrast' | 'tiny_font' | 'hidden_element' | 'no_styling'
  | 'off_screen' | 'misleading_label' | 'confirm_shaming'
  | 'buried_in_footer' | 'opacity_hidden';

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface DetectedPattern {
  id: string;
  category: PatternCategory;
  severity: Severity;
  description: string;
  element: string;
  selector: string;
  details: Record<string, unknown>;
  fixSuggestion: string;
  fixedElement?: string;
}

const UNSUBSCRIBE_KEYWORDS = [
  'unsubscribe', 'opt out', 'opt-out', 'cancel', 'stop receiving',
  'remove me', 'manage preferences', 'email preferences',
  'manage subscriptions', 'stop emails',
];

const CONFIRM_SHAMING = [
  /no\s+thanks?,?\s+i\s+(enjoy|love|like)/i,
  /no\s+thanks?,?\s+i\s+(don'?t|do not)\s+(want|need|care)/i,
  /no\s+thanks?,?\s+i\s+(hate|dislike)\s+(saving|money|deals)/i,
  /i\s+don'?t\s+want\s+(to\s+save|deals|offers|discounts)/i,
  /no\s+thanks?,?\s+i\s+(already|know everything)/i,
  /no\s+thanks?,?\s+i\s+(prefer\s+to\s+stay|remain)\s+(poor|broke)/i,
];

const MISLEADING_LABELS = [
  /to\s+stop\s+receiving\s+emails?,?\s+click\s+here/i,
  /if\s+you\s+(wish|want)\s+to\s+unsubscribe/i,
  /you\s+can\s+unsubscribe\s+at\s+any\s+time/i,
  /click\s+here\s+to\s+(unsubscribe|opt.?out)/i,
];

const CATEGORY_MAX: Record<PatternCategory, number> = {
  low_contrast: 25, tiny_font: 15, hidden_element: 20, no_styling: 10,
  off_screen: 20, misleading_label: 15, confirm_shaming: 20,
  buried_in_footer: 10, opacity_hidden: 20,
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 3, medium: 8, high: 15, critical: 25,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseStyle(s: string): Record<string, string> {
  const r: Record<string, string> = {};
  if (!s) return r;
  for (const d of s.split(';')) {
    const [k, ...v] = d.split(':');
    if (k && v.length) r[k.trim().toLowerCase()] = v.join(':').trim();
  }
  return r;
}

function isUnsub($el: cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>): boolean {
  const text = ($el.text() || '').toLowerCase();
  const href = ($el.attr('href') || '').toLowerCase();
  const aria = ($el.attr('aria-label') || '').toLowerCase();
  return UNSUBSCRIBE_KEYWORDS.some(k => text.includes(k) || href.includes(k) || aria.includes(k));
}

function parseCssColor(c: string): [number, number, number] | null {
  const rgb = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  const hex6 = c.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex6) return [parseInt(hex6[1], 16), parseInt(hex6[2], 16), parseInt(hex6[3], 16)];
  const hex3 = c.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (hex3) return [parseInt(hex3[1] + hex3[1], 16), parseInt(hex3[2] + hex3[2], 16), parseInt(hex3[3] + hex3[3], 16)];
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255], black: [0, 0, 0], gray: [128, 128, 128],
    grey: [128, 128, 128], silver: [192, 192, 192],
  };
  return named[c.toLowerCase()] ?? null;
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: string, bg: string): number | null {
  const f = parseCssColor(fg), b = parseCssColor(bg);
  if (!f || !b) return null;
  const l1 = luminance(...f), l2 = luminance(...b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function detectPatterns(html: string): DetectedPattern[] {
  const $ = cheerio.load(html);
  const patterns: DetectedPattern[] = [];

  // 1. Low contrast
  $('a, button, span').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    if (!isUnsub($el)) return;
    const st = parseStyle($el.attr('style') || '');
    const ratio = contrastRatio(st['color'] || '#000', st['background-color'] || st['background'] || '#fff');
    if (ratio !== null && ratio < 4.5) {
      const sev: Severity = ratio < 1.5 ? 'critical' : ratio < 3 ? 'high' : 'medium';
      patterns.push({
        id: uid(), category: 'low_contrast', severity: sev,
        description: `Unsubscribe element has contrast ratio ${ratio.toFixed(2)}:1 (WCAG minimum is 4.5:1)`,
        element: $.html($el)?.slice(0, 300) || '',
        selector: el.tagName,
        details: { contrastRatio: ratio.toFixed(2), color: st['color'], background: st['background-color'] },
        fixSuggestion: 'Increase text contrast to at least 4.5:1 — use a darker text colour.',
        fixedElement: ($.html($el) || '').replace(/color:[^;"]*/i, 'color: #1a1a1a'),
      });
    }
  });

  // 2. Tiny font
  $('a, button, span').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    if (!isUnsub($el)) return;
    const st = parseStyle($el.attr('style') || '');
    const px = parseFloat(st['font-size'] || '0');
    if (px > 0 && px < 10) {
      patterns.push({
        id: uid(), category: 'tiny_font', severity: px < 7 ? 'critical' : 'high',
        description: `Opt-out link has font-size ${px}px — below the readable minimum of 10px`,
        element: $.html($el)?.slice(0, 300) || '',
        selector: el.tagName, details: { fontSize: px },
        fixSuggestion: 'Set font-size to at least 12px for all actionable links.',
        fixedElement: ($.html($el) || '').replace(/font-size:[^;"]*/i, 'font-size: 12px'),
      });
    }
  });

  // 3. Hidden / invisible
  $('a, button').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    if (!isUnsub($el)) return;
    const st = parseStyle($el.attr('style') || '');
    const isHidden =
      st['display'] === 'none' || st['visibility'] === 'hidden' ||
      (st['position'] === 'absolute' && (parseFloat(st['left'] || '0') < -9000 || parseFloat(st['top'] || '0') < -9000));
    if (isHidden) {
      patterns.push({
        id: uid(), category: 'hidden_element', severity: 'critical',
        description: 'Unsubscribe element is hidden with CSS (display:none or visibility:hidden)',
        element: $.html($el)?.slice(0, 300) || '',
        selector: el.tagName, details: st,
        fixSuggestion: 'Remove display:none/visibility:hidden from the unsubscribe element.',
      });
    }
  });

  // 4. Near-zero opacity
  $('a, button, span').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    if (!isUnsub($el)) return;
    const st = parseStyle($el.attr('style') || '');
    const op = parseFloat(st['opacity'] ?? '1');
    if (!isNaN(op) && op < 0.3) {
      patterns.push({
        id: uid(), category: 'opacity_hidden', severity: op < 0.1 ? 'critical' : 'high',
        description: `Opt-out element has opacity ${op} — nearly invisible`,
        element: $.html($el)?.slice(0, 300) || '',
        selector: el.tagName, details: { opacity: op },
        fixSuggestion: 'Set opacity to 1 for the unsubscribe link.',
        fixedElement: ($.html($el) || '').replace(/opacity\s*:\s*[\d.]+/i, 'opacity: 1'),
      });
    }
  });

  // 5. No underline / plain text link
  $('a').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    if (!isUnsub($el)) return;
    const st = parseStyle($el.attr('style') || '');
    if (st['text-decoration']?.includes('none')) {
      patterns.push({
        id: uid(), category: 'no_styling', severity: 'medium',
        description: 'Unsubscribe link has text-decoration:none — looks like plain text, not a link',
        element: $.html($el)?.slice(0, 300) || '',
        selector: 'a', details: { textDecoration: 'none' },
        fixSuggestion: 'Add text-decoration:underline so the link is visually distinct.',
        fixedElement: ($.html($el) || '').replace(/text-decoration\s*:\s*none/i, 'text-decoration: underline'),
      });
    }
  });

  // 6. Buried in footer
  $('footer, .footer, #footer, [class*="footer"], [id*="footer"]').each((_, footer) => {
    $(footer).find('a, button').each((_, el) => {
      const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
      if (!isUnsub($el)) return;
      patterns.push({
        id: uid(), category: 'buried_in_footer', severity: 'medium',
        description: 'Unsubscribe link is buried in the page footer — hard to find',
        element: $.html($el)?.slice(0, 300) || '',
        selector: 'footer a', details: {},
        fixSuggestion: 'Provide a visible unsubscribe option near subscription-related content, not just the footer.',
      });
    });
  });

  // 7. Misleading labels
  $('a, p, span, div').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    const text = $el.text();
    for (const re of MISLEADING_LABELS) {
      if (re.test(text)) {
        patterns.push({
          id: uid(), category: 'misleading_label', severity: 'medium',
          description: `Misleading opt-out label: "${text.trim().slice(0, 80)}"`,
          element: $.html($el)?.slice(0, 300) || '',
          selector: el.tagName, details: { text: text.trim().slice(0, 100) },
          fixSuggestion: 'Use a direct "Unsubscribe" label as a visible button or styled link.',
        });
        break;
      }
    }
  });

  // 8. Confirm-shaming
  $('a, button, label, span, p').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    const text = $el.text();
    for (const re of CONFIRM_SHAMING) {
      if (re.test(text)) {
        patterns.push({
          id: uid(), category: 'confirm_shaming', severity: 'high',
          description: `Confirm-shaming language: "${text.trim().slice(0, 80)}"`,
          element: $.html($el)?.slice(0, 300) || '',
          selector: el.tagName, details: { text: text.trim().slice(0, 100) },
          fixSuggestion: 'Replace with neutral language like "No thanks" or "Not now".',
          fixedElement: '<span>No thanks</span>',
        });
        break;
      }
    }
  });

  // 9. Pre-ticked checkboxes
  $('input[type="checkbox"]').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    const checked = $el.attr('checked') !== undefined;
    if (!checked) return;
    const label = ($el.closest('label').text() || $el.attr('name') || '').toLowerCase();
    if (/newsletter|email|offer|promotion|partner|marketing|subscri/i.test(label)) {
      patterns.push({
        id: uid(), category: 'misleading_label', severity: 'high',
        description: `Pre-ticked marketing checkbox: "${label.slice(0, 80)}"`,
        element: $.html($el)?.slice(0, 300) || '',
        selector: 'input[type="checkbox"][checked]',
        details: { label },
        fixSuggestion: 'Opt-in checkboxes must be unchecked by default (GDPR Article 7).',
        fixedElement: ($.html($el) || '').replace(/\s+checked(="[^"]*")?/i, ''),
      });
    }
  });

  // 10. Countdown timers (false urgency)
  $('[class*="countdown"],[id*="countdown"],[class*="timer"],[id*="timer"]').each((_, el) => {
    const $el = $(el) as cheerio.Cheerio<cheerio.Element & { attribs: Record<string, string> }>;
    patterns.push({
      id: uid(), category: 'misleading_label', severity: 'medium',
      description: 'Countdown timer detected — may create artificial urgency',
      element: $.html($el)?.slice(0, 300) || '',
      selector: el.tagName, details: {},
      fixSuggestion: 'Only use countdown timers for genuine limited-time offers.',
    });
  });

  return patterns;
}

function scorePatterns(patterns: DetectedPattern[]) {
  const breakdown: Partial<Record<PatternCategory, number>> = {};
  for (const p of patterns) {
    const max = CATEGORY_MAX[p.category];
    breakdown[p.category] = Math.min((breakdown[p.category] ?? 0) + SEVERITY_WEIGHT[p.severity], max);
  }
  const totalMax = Object.values(CATEGORY_MAX).reduce((a, b) => a + b, 0);
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const evilScore = Math.min(Math.round((total / totalMax) * 100), 100);
  const full = Object.fromEntries(
    (Object.keys(CATEGORY_MAX) as PatternCategory[]).map(k => [k, breakdown[k] ?? 0])
  ) as Record<PatternCategory, number>;
  return { evilScore, breakdown: full };
}

function generateLinkedInPost(url: string | undefined, score: number, patterns: DetectedPattern[]): string {
  const site = url ? (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } })() : 'this page';
  const top3 = [...patterns].sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]).slice(0, 3);
  const opener = score >= 70
    ? `🚫 I scanned ${site} and found ${patterns.length} dark patterns. Here's what they don't want you to see 👇`
    : score >= 40
    ? `⚠️ I scanned ${site} and found ${patterns.length} suspicious UX patterns 👇`
    : `🔍 Dark pattern audit on ${site} — here's the full breakdown 👇`;
  const bar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));
  const lines = top3.map((p, i) => `\n${i + 1}. ${p.severity === 'critical' ? '🚨' : p.severity === 'high' ? '⚠️' : '🟡'} ${p.description.slice(0, 100)}`).join('');
  return `${opener}\n\n🎯 Evil Score: ${score}/100\n${bar} ${score}%${top3.length ? '\n\nTop patterns found:' + lines : ''}\n\n👉 Try the scanner: https://github.com/findsri/dark-pattern-detector\n\n#DarkPatterns #UX #Ethics #WebDesign #AI #Accessibility`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; html?: string; isEmail?: boolean };
    const { url, html: rawHtml, isEmail = false } = body;

    if (!url && !rawHtml) {
      return NextResponse.json({ error: 'Either url or html is required' }, { status: 400 });
    }

    let pageHtml = rawHtml ?? '';

    // Fetch page HTML if URL was given
    if (url && !rawHtml) {
      try {
        const res = await axios.get<string>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; DarkPatternBot/1.0; +https://github.com/findsri/dark-pattern-detector)',
            'Accept': 'text/html,application/xhtml+xml',
          },
          timeout: 20000,
          responseType: 'text',
          maxRedirects: 5,
        });
        pageHtml = res.data;
      } catch (fetchErr) {
        const msg = axios.isAxiosError(fetchErr)
          ? fetchErr.message
          : 'Network error';
        return NextResponse.json(
          { error: `Could not fetch the URL: ${msg}. Try pasting the page HTML directly instead.` },
          { status: 422 }
        );
      }
    }

    const patterns = detectPatterns(pageHtml);
    const { evilScore, breakdown } = scorePatterns(patterns);
    const linkedInPost = generateLinkedInPost(url, evilScore, patterns);

    // Generate basic diffs
    const diff = patterns
      .filter(p => p.fixedElement && p.fixedElement !== p.element)
      .slice(0, 10)
      .map(p => ({ original: p.element, fixed: p.fixedElement!, description: p.fixSuggestion }));

    return NextResponse.json({
      scanId: `live-${Date.now()}`,
      url,
      scannedAt: new Date().toISOString(),
      evilScore,
      totalPatterns: patterns.length,
      scoreBreakdown: breakdown,
      patterns,
      linkedInPost,
      diff,
    });
  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Internal scan error' }, { status: 500 });
  }
}
