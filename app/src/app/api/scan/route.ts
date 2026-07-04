import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

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

const CATEGORY_MAX: Record<PatternCategory, number> = {
  low_contrast: 25, tiny_font: 15, hidden_element: 20, no_styling: 10,
  off_screen: 20, misleading_label: 15, confirm_shaming: 20,
  buried_in_footer: 10, opacity_hidden: 20,
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 3, medium: 8, high: 15, critical: 25,
};

// ── Keywords & patterns ───────────────────────────────────────────────────────

const UNSUB_TEXT = [
  'unsubscribe', 'opt out', 'opt-out', 'optout',
  'cancel subscription', 'cancel my subscription',
  'stop receiving', 'stop emails', 'remove me',
  'manage preferences', 'email preferences',
  'manage subscriptions', 'manage notifications',
  'notification settings', 'email settings',
];

const UNSUB_HREF = [
  'unsubscribe', 'optout', 'opt-out', 'opt_out',
  'cancel', 'preferences', 'notifications/manage',
  'email-settings', 'communication-preferences',
];

const CONFIRM_SHAMING_RE = [
  /no\s+thanks?,?\s+i\s+(enjoy|love|like)\s+/i,
  /no\s+thanks?,?\s+i\s+(don'?t|do\s+not)\s+(want|need|care)/i,
  /no\s+thanks?,?\s+i\s+(hate|dislike)\s+(saving|money|deals)/i,
  /i\s+don'?t\s+want\s+(to\s+save|deals|offers|discounts)/i,
  /no\s+thanks?,?\s+i\s+(already\s+know|know\s+everything)/i,
  /no\s+thanks?,?\s+(i'll?\s+)?(stay|remain)\s+(broke|poor|behind)/i,
  /i\s+(prefer|choose)\s+to\s+(stay|remain)\s+(ignorant|behind|uninformed)/i,
];

const MISLEADING_LABEL_RE = [
  /to\s+stop\s+receiving\s+emails?,?\s+click\s+here/i,
  /if\s+you\s+(wish|want|prefer)\s+to\s+unsubscribe/i,
  /click\s+here\s+to\s+(unsubscribe|opt.?out|stop)/i,
  /to\s+(opt.?out|unsubscribe|stop),?\s+click/i,
];

const SCARCITY_RE = [
  /only\s+\d+\s+(left|remaining|in\s+stock|available)/i,
  /\d+\s+people?\s+(are\s+)?(viewing|watching|looking)/i,
  /\d+\s+sold\s+in\s+(last|past)\s+\d+\s+hours?/i,
  /hurry[,!]?\s+(only|just)\s+\d+/i,
  /limited\s+(time|offer|stock|availability)/i,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

function parseStyle(s: string): Record<string, string> {
  const r: Record<string, string> = {};
  if (!s) return r;
  for (const d of s.split(';')) {
    const idx = d.indexOf(':');
    if (idx === -1) continue;
    r[d.slice(0, idx).trim().toLowerCase()] = d.slice(idx + 1).trim();
  }
  return r;
}

function parseCssColor(c: string): [number, number, number] | null {
  if (!c) return null;
  const rgb = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return [+rgb[1], +rgb[2], +rgb[3]];
  const hex6 = c.replace('#','').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex6) return [parseInt(hex6[1],16), parseInt(hex6[2],16), parseInt(hex6[3],16)];
  const hex3 = c.replace('#','').match(/^([a-f\d])([a-f\d])([a-f\d])$/i);
  if (hex3) return [parseInt(hex3[1]+hex3[1],16), parseInt(hex3[2]+hex3[2],16), parseInt(hex3[3]+hex3[3],16)];
  const named: Record<string,[number,number,number]> = {
    white:[255,255,255], black:[0,0,0], gray:[128,128,128],
    grey:[128,128,128], silver:[192,192,192], lightgray:[211,211,211],
    lightgrey:[211,211,211], gainsboro:[220,220,220], whitesmoke:[245,245,245],
  };
  return named[c.toLowerCase()] ?? null;
}

function luminance(r:number,g:number,b:number): number {
  return [r,g,b].map(v => { const s=v/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); })
    .reduce((acc,v,i)=>acc+v*[0.2126,0.7152,0.0722][i],0);
}

function contrastRatio(fg:string, bg:string): number|null {
  const f=parseCssColor(fg), b=parseCssColor(bg);
  if(!f||!b) return null;
  const l1=luminance(...f), l2=luminance(...b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}

// Check if ANY class on the element suggests hidden/muted styling
function classImpliesHidden(cls: string): boolean {
  return /\b(sr-only|visually-?hidden|hidden|invisible|d-none|hide|off-?screen|clip)\b/i.test(cls);
}

function classImpliesSmall(cls: string): boolean {
  return /\b(text-xs|text-\[[\d.]+px\]|small|tiny|micro|fine-?print)\b/i.test(cls);
}

function elSnippet($: cheerio.CheerioAPI, el: cheerio.Element): string {
  return ($.html(el) || '').slice(0, 300);
}

// Does text or href indicate an unsubscribe/opt-out intent?
function isUnsubEl($: cheerio.CheerioAPI, el: cheerio.Element): boolean {
  const $el = $(el);
  const text = ($el.text() || '').toLowerCase().trim();
  const href = ($el.attr('href') || '').toLowerCase();
  const aria = ($el.attr('aria-label') || '').toLowerCase();
  const title= ($el.attr('title') || '').toLowerCase();
  const combined = `${text} ${href} ${aria} ${title}`;
  return UNSUB_TEXT.some(k => combined.includes(k)) ||
         UNSUB_HREF.some(k => href.includes(k));
}

// ── Read computed styles injected by extension content.js ─────────────────────
// Extension annotates elements with data-dpd-color, data-dpd-bg, etc.
// We use these when available — they reflect the REAL computed styles.
interface ComputedInfo {
  color?: string;
  bg?: string;
  fontSize?: number;
  display?: string;
  visibility?: string;
  opacity?: number;
  textDecoration?: string;
  offScreen?: boolean;
}

function getComputed($: cheerio.CheerioAPI, el: cheerio.Element): ComputedInfo {
  const $el = $(el);
  const info: ComputedInfo = {};

  const color   = $el.attr('data-dpd-color');
  const bg      = $el.attr('data-dpd-bg');
  const fsRaw   = $el.attr('data-dpd-fontsize');
  const display = $el.attr('data-dpd-display');
  const vis     = $el.attr('data-dpd-visibility');
  const opRaw   = $el.attr('data-dpd-opacity');
  const tdec    = $el.attr('data-dpd-textdec');
  const offscr  = $el.attr('data-dpd-offscreen');

  if (color)   info.color       = color;
  if (bg)      info.bg          = bg;
  if (fsRaw)   info.fontSize    = parseFloat(fsRaw);
  if (display) info.display     = display;
  if (vis)     info.visibility  = vis;
  if (opRaw)   info.opacity     = parseFloat(opRaw);
  if (tdec)    info.textDecoration = tdec;
  if (offscr)  info.offScreen   = offscr === '1';

  // Fall back to inline style if no computed data available
  if (!color && !bg) {
    const st = parseStyle($el.attr('style') || '');
    if (st['color'])            info.color          = st['color'];
    if (st['background-color']) info.bg             = st['background-color'];
    if (st['background'])       info.bg             = info.bg || st['background'];
    if (st['font-size'])        info.fontSize       = parseFloat(st['font-size']);
    if (st['display'])          info.display        = st['display'];
    if (st['visibility'])       info.visibility     = st['visibility'];
    if (st['opacity'])          info.opacity        = parseFloat(st['opacity']);
    if (st['text-decoration'])  info.textDecoration = st['text-decoration'];
  }

  return info;
}

// ── Main detector — works on real-world HTML (classes, not just inline) ───────

function detectPatterns(html: string, sourceUrl?: string): DetectedPattern[] {
  const $ = cheerio.load(html);
  const patterns: DetectedPattern[] = [];
  const seen = new Set<string>(); // deduplicate by description

  function add(p: DetectedPattern) {
    const key = `${p.category}::${p.description.slice(0,60)}`;
    if (seen.has(key)) return;
    seen.add(key);
    patterns.push(p);
  }

  // ── 1. Low contrast on opt-out elements (inline style OR computed) ──────────
  $('a, button, span, small, p').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const c = getComputed($, el);
    const ratio = contrastRatio(c.color || '#000000', c.bg || '#ffffff');
    if (ratio !== null && ratio < 4.5) {
      const sev: Severity = ratio < 1.5 ? 'critical' : ratio < 3 ? 'high' : 'medium';
      add({ id: uid(), category: 'low_contrast', severity: sev,
        description: `Opt-out element has contrast ratio ${ratio.toFixed(2)}:1 (WCAG min 4.5:1)`,
        element: elSnippet($, el), selector: el.tagName,
        details: { contrastRatio: ratio.toFixed(2), color: c.color, bg: c.bg },
        fixSuggestion: 'Increase text contrast to at least 4.5:1.',
        fixedElement: elSnippet($, el).replace(/color\s*:[^;"]*/i, 'color: #1a1a1a'),
      });
    }
  });

  // ── 2. Tiny font-size (computed OR inline) ────────────────────────────────
  $('a, button, span, small, p').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const c = getComputed($, el);
    const px = c.fontSize ?? 0;
    if (px > 0 && px < 11) {
      add({ id: uid(), category: 'tiny_font', severity: px < 7 ? 'critical' : 'high',
        description: `Opt-out text is ${px}px — designed to be missed (min readable: 12px)`,
        element: elSnippet($, el), selector: el.tagName, details: { fontSize: px },
        fixSuggestion: 'Set font-size to at least 12px.',
        fixedElement: elSnippet($, el).replace(/font-size\s*:[^;"]*/i, 'font-size: 12px'),
      });
    }
  });

  // ── 3. Hidden via computed display/visibility ─────────────────────────────
  $('a, button').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const c = getComputed($, el);
    if (c.display === 'none' || c.visibility === 'hidden' || c.offScreen) {
      add({ id: uid(), category: 'hidden_element', severity: 'critical',
        description: 'Opt-out button is not visible on screen (hidden via CSS)',
        element: elSnippet($, el), selector: el.tagName, details: { ...c },
        fixSuggestion: 'Make the unsubscribe link visible to users.',
      });
    }
  });

  // ── 4. Hidden via sr-only / visually-hidden CSS class ─────────────────────
  $('a, button').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const cls = $(el).attr('class') || '';
    if (classImpliesHidden(cls)) {
      add({ id: uid(), category: 'hidden_element', severity: 'high',
        description: `Opt-out element uses a visually-hiding CSS class: "${cls.trim().slice(0,40)}"`,
        element: elSnippet($, el), selector: el.tagName, details: { class: cls },
        fixSuggestion: 'Remove sr-only/hidden class from the unsubscribe link.',
      });
    }
  });

  // ── 5. Near-zero opacity (computed OR inline) ────────────────────────────
  $('a, button, span').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const c = getComputed($, el);
    const op = c.opacity ?? 1;
    if (op < 0.3) {
      add({ id: uid(), category: 'opacity_hidden', severity: op < 0.1 ? 'critical' : 'high',
        description: `Opt-out element has opacity ${op} — nearly invisible to users`,
        element: elSnippet($, el), selector: el.tagName, details: { opacity: op },
        fixSuggestion: 'Set opacity to 1.',
        fixedElement: elSnippet($, el).replace(/opacity\s*:\s*[\d.]+/i, 'opacity: 1'),
      });
    }
  });

  // ── 6. No underline (computed OR inline text-decoration) ─────────────────
  $('a').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const c = getComputed($, el);
    const td = (c.textDecoration || '').toLowerCase();
    if (td.includes('none')) {
      add({ id: uid(), category: 'no_styling', severity: 'medium',
        description: 'Unsubscribe link has no underline — looks like plain text, not clickable',
        element: elSnippet($, el), selector: 'a', details: {},
        fixSuggestion: 'Add underline or button style to opt-out links.',
        fixedElement: elSnippet($, el).replace(/text-decoration\s*:\s*none/i, 'text-decoration: underline'),
      });
    }
  });

  // ── 7. Small text class (Tailwind text-xs etc.) on opt-out links ──────────
  $('a, button, span').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    const cls = $(el).attr('class') || '';
    if (classImpliesSmall(cls)) {
      add({ id: uid(), category: 'tiny_font', severity: 'medium',
        description: `Opt-out element uses a tiny-text CSS class: "${cls.trim().slice(0,40)}"`,
        element: elSnippet($, el), selector: el.tagName, details: { class: cls },
        fixSuggestion: 'Use at least text-sm (14px) for all actionable opt-out links.',
      });
    }
  });

  // ── 8. Buried in footer ───────────────────────────────────────────────────
  $('footer, [class*="footer"], [id*="footer"], [role="contentinfo"]').each((_, footer) => {
    $(footer).find('a, button').each((_, el) => {
      if (!isUnsubEl($, el)) return;
      add({ id: uid(), category: 'buried_in_footer', severity: 'medium',
        description: 'Opt-out link is only in the footer — hard to find without scrolling to the bottom',
        element: elSnippet($, el), selector: 'footer a', details: {},
        fixSuggestion: 'Provide a visible unsubscribe option near subscription content, not only the footer.',
      });
    });
  });

  // ── 9. Confirm-shaming language ───────────────────────────────────────────
  $('a, button, label, span, p, div').each((_, el) => {
    const text = ($(el).text() || '').trim();
    if (text.length < 5 || text.length > 200) return;
    for (const re of CONFIRM_SHAMING_RE) {
      if (re.test(text)) {
        add({ id: uid(), category: 'confirm_shaming', severity: 'high',
          description: `Confirm-shaming: "${text.slice(0, 90)}"`,
          element: elSnippet($, el), selector: el.tagName, details: { text: text.slice(0,100) },
          fixSuggestion: 'Replace with neutral language: "No thanks" or "Not now".',
          fixedElement: '<span>No thanks</span>',
        });
        break;
      }
    }
  });

  // ── 10. Misleading labels ─────────────────────────────────────────────────
  $('a, p, span, div, td').each((_, el) => {
    const text = ($(el).text() || '').trim();
    if (text.length < 5 || text.length > 300) return;
    for (const re of MISLEADING_LABEL_RE) {
      if (re.test(text)) {
        add({ id: uid(), category: 'misleading_label', severity: 'medium',
          description: `Misleading opt-out label: "${text.slice(0,80)}"`,
          element: elSnippet($, el), selector: el.tagName, details: { text: text.slice(0,100) },
          fixSuggestion: 'Use a direct "Unsubscribe" label with clear button styling.',
        });
        break;
      }
    }
  });

  // ── 11. Pre-checked marketing checkboxes ─────────────────────────────────
  $('input[type="checkbox"]').each((_, el) => {
    const $el = $(el);
    if ($el.attr('checked') === undefined) return;
    const labelText = ($el.closest('label').text() || $el.attr('name') || $el.attr('id') || '').toLowerCase();
    if (/newsletter|email|offer|promot|partner|marketing|subscri|update|notif/i.test(labelText)) {
      add({ id: uid(), category: 'misleading_label', severity: 'high',
        description: `Pre-ticked marketing opt-in: "${labelText.slice(0,80)}"`,
        element: elSnippet($, el), selector: 'input[checked]', details: { label: labelText },
        fixSuggestion: 'Marketing checkboxes must be unchecked by default (GDPR Article 7).',
        fixedElement: elSnippet($, el).replace(/\s+checked(="[^"]*")?/i, ''),
      });
    }
  });

  // ── 12. Countdown / fake urgency elements ────────────────────────────────
  $('[class*="countdown"],[id*="countdown"],[class*="timer"],[id*="timer"],[data-countdown],[data-timer]').each((_, el) => {
    add({ id: uid(), category: 'misleading_label', severity: 'medium',
      description: 'Countdown timer found — may be creating artificial urgency',
      element: elSnippet($, el), selector: el.tagName, details: {},
      fixSuggestion: 'Only use countdown timers for genuine limited-time offers.',
    });
  });

  // ── 13. Fake scarcity ("only X left") ────────────────────────────────────
  $('span, p, div, strong, b').each((_, el) => {
    const text = ($(el).text() || '').trim();
    if (text.length > 150) return;
    for (const re of SCARCITY_RE) {
      if (re.test(text)) {
        add({ id: uid(), category: 'misleading_label', severity: 'low',
          description: `Possible artificial scarcity: "${text.slice(0,80)}"`,
          element: elSnippet($, el), selector: el.tagName, details: { text: text.slice(0,100) },
          fixSuggestion: 'Only display real-time stock/demand data that is accurate.',
        });
        break;
      }
    }
  });

  // ── 14. Roach motel: easy sign-up vs hard cancel ─────────────────────────
  // If page has a prominent sign-up/subscribe CTA but NO visible cancel/unsubscribe
  const hasSignupCta = $('button, a').toArray().some(el => {
    const t = ($(el).text()||'').toLowerCase();
    return /\b(sign\s*up|get\s*started|subscribe|join\s+now|start\s+free|try\s+free|create\s+account)\b/.test(t);
  });
  const hasCancelLink = $('a, button').toArray().some(el => isUnsubEl($, el));

  if (hasSignupCta && !hasCancelLink) {
    add({ id: uid(), category: 'hidden_element', severity: 'high',
      description: 'Page has prominent sign-up CTAs but no visible cancel/unsubscribe option (roach motel)',
      element: '', selector: 'body', details: {},
      fixSuggestion: 'Provide a clearly visible way to cancel or unsubscribe from the same page that promotes signing up.',
    });
  }

  // ── 15. Computed-style low contrast (from extension data-dpd attributes) ────
  // This catches cases where CSS classes make text near-invisible —
  // only detectable via computed styles from the real browser.
  $('[data-dpd-color]').each((_, el) => {
    const c = getComputed($, el);
    if (!c.color || !c.bg) return;
    const ratio = contrastRatio(c.color, c.bg);
    if (ratio !== null && ratio < 3) {
      const text = ($(el).text() || '').trim().toLowerCase();
      if (text.length < 2) return;
      add({ id: uid(), category: 'low_contrast', severity: ratio < 1.5 ? 'critical' : 'high',
        description: `"${text.slice(0,40)}" has computed contrast ${ratio.toFixed(2)}:1 — text is near invisible`,
        element: elSnippet($, el), selector: el.tagName,
        details: { contrastRatio: ratio.toFixed(2), color: c.color, bg: c.bg, source: 'computed' },
        fixSuggestion: 'Increase contrast ratio to at least 4.5:1 for all text.',
      });
    }
  });

  // ── 16. Off-screen elements flagged by extension ─────────────────────────
  $('[data-dpd-offscreen="1"]').each((_, el) => {
    if (!isUnsubEl($, el)) return;
    add({ id: uid(), category: 'off_screen', severity: 'critical',
      description: 'Opt-out element is off-screen (zero width/height in real browser layout)',
      element: elSnippet($, el), selector: el.tagName, details: {},
      fixSuggestion: 'Ensure the unsubscribe element is visible and in the normal document flow.',
    });
  });

  // ── 16. Page-level structural signals ────────────────────────────────────
  const bodyText = ($('body').text() || '').toLowerCase();
  const htmlStr = html.toLowerCase();

  // Autoplay/autoenroll hints
  if (/auto.?renew|auto.?enroll|automatically\s+(charged|billed|renewed)/i.test(htmlStr)) {
    add({ id: uid(), category: 'misleading_label', severity: 'medium',
      description: 'Page mentions automatic renewal/billing — ensure it is clearly disclosed before sign-up',
      element: '', selector: 'body', details: {},
      fixSuggestion: 'Display auto-renewal terms prominently before the user commits.',
    });
  }

  // Cookie consent missing
  if (!/cookie|gdpr|consent|privacy\s+notice/i.test(htmlStr) && sourceUrl) {
    // Only flag for non-trivial pages
    if (html.length > 5000) {
      add({ id: uid(), category: 'misleading_label', severity: 'low',
        description: 'No cookie consent or privacy notice detected on the page',
        element: '', selector: 'body', details: {},
        fixSuggestion: 'Add a GDPR-compliant cookie consent banner.',
      });
    }
  }

  return patterns;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePatterns(patterns: DetectedPattern[]) {
  const breakdown: Partial<Record<PatternCategory, number>> = {};
  for (const p of patterns) {
    breakdown[p.category] = Math.min(
      (breakdown[p.category] ?? 0) + SEVERITY_WEIGHT[p.severity],
      CATEGORY_MAX[p.category]
    );
  }
  const totalMax = Object.values(CATEGORY_MAX).reduce((a, b) => a + b, 0);
  const total    = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const evilScore = Math.min(Math.round((total / totalMax) * 100), 100);
  const full = Object.fromEntries(
    (Object.keys(CATEGORY_MAX) as PatternCategory[]).map(k => [k, breakdown[k] ?? 0])
  ) as Record<PatternCategory, number>;
  return { evilScore, breakdown: full };
}

// ── LinkedIn post ─────────────────────────────────────────────────────────────

function generateLinkedInPost(url: string | undefined, score: number, patterns: DetectedPattern[]): string {
  const site = url ? (() => { try { return new URL(url).hostname.replace('www.',''); } catch { return url; } })() : 'this page';
  const top3 = [...patterns]
    .sort((a,b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
    .slice(0, 3);
  const opener = score >= 70
    ? `🚫 I scanned ${site} and found ${patterns.length} dark patterns. Here's what they don't want you to see 👇`
    : score >= 40
    ? `⚠️ I scanned ${site} and found ${patterns.length} suspicious UX patterns 👇`
    : `🔍 Dark pattern audit on ${site} — here's the full breakdown 👇`;
  const bar = '█'.repeat(Math.round(score/10)) + '░'.repeat(10 - Math.round(score/10));
  const lines = top3.map((p,i) =>
    `\n${i+1}. ${p.severity==='critical'?'🚨':p.severity==='high'?'⚠️':'🟡'} ${p.description.slice(0,100)}`
  ).join('');
  return `${opener}\n\n🎯 Evil Score: ${score}/100\n${bar} ${score}%${
    top3.length ? '\n\nTop patterns found:'+lines : ''
  }\n\n👉 Try the scanner: https://github.com/findsri/dark-pattern-detector\n\n#DarkPatterns #UX #Ethics #WebDesign #AI #Accessibility`;
}

// ── Fetch HTML from a URL (real browser-like headers) ────────────────────────

async function fetchHtml(url: string): Promise<{ html: string; error?: string }> {
  const attempts = [
    // Attempt 1: Chrome-like desktop UA
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    },
    // Attempt 2: Googlebot (often less blocked)
    {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html',
    },
  ];

  let lastError = '';
  for (const headers of attempts) {
    try {
      const res = await axios.get<string>(url, {
        headers,
        timeout: 25000,
        responseType: 'text',
        maxRedirects: 8,
        validateStatus: s => s < 500,
      });
      const html = res.data;
      if (html && html.length > 500) return { html };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { html: '', error: lastError };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; html?: string; isEmail?: boolean };
    const { url, html: rawHtml } = body;

    if (!url && !rawHtml) {
      return NextResponse.json({ error: 'Either url or html is required' }, { status: 400 });
    }

    let pageHtml = rawHtml ?? '';
    let fetchWarning: string | undefined;

    if (url && !rawHtml) {
      const { html, error } = await fetchHtml(url);
      if (!html) {
        return NextResponse.json({
          error: `Could not fetch this URL: ${error || 'blocked or unreachable'}. Try pasting the page HTML directly instead.`,
        }, { status: 422 });
      }
      // If we got a very short page it's likely a bot-wall
      if (html.length < 2000) {
        fetchWarning = 'This site may be blocking automated access — results may be limited. For best results, paste the page HTML directly.';
      }
      pageHtml = html;
    }

    const patterns = detectPatterns(pageHtml, url);
    const { evilScore, breakdown } = scorePatterns(patterns);
    const linkedInPost = generateLinkedInPost(url, evilScore, patterns);

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
      warning: fetchWarning,
    });
  } catch (err) {
    console.error('Scan error:', err);
    return NextResponse.json({ error: 'Internal scan error' }, { status: 500 });
  }
}
