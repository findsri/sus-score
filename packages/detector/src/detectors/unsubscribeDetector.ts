import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { DetectedPattern, PatternCategory, Severity } from '../types';
import { getContrastRatio } from '../utils/contrast';
import { v4 as uuidv4 } from 'uuid';

// Keywords that indicate unsubscribe/opt-out intent
const UNSUBSCRIBE_KEYWORDS = [
  'unsubscribe', 'opt out', 'opt-out', 'cancel', 'stop receiving',
  'remove me', 'manage preferences', 'email preferences', 'manage subscriptions',
  'stop emails', 'no thanks', 'click here to stop', 'click here to unsubscribe',
];

const CONFIRM_SHAMING_PATTERNS = [
  /no\s+thanks?,?\s+i\s+(enjoy|love|like)/i,
  /no\s+thanks?,?\s+i\s+(don'?t|do not)\s+(want|need|care)/i,
  /i\s+(prefer|want)\s+to\s+(stay|remain)\s+(poor|broke|uninformed|behind)/i,
  /no\s+thanks?,?\s+i\s+(hate|dislike)\s+(saving|money|deals|discounts)/i,
  /i\s+don'?t\s+want\s+(to\s+save|deals|offers|discounts)/i,
  /no\s+thanks?,?\s+i\s+(already|know everything|am fine)/i,
];

const MISLEADING_LABEL_PATTERNS = [
  /to\s+stop\s+receiving\s+emails?,?\s+click\s+here/i,
  /click\s+here\s+to\s+unsubscribe/i,
  /if\s+you\s+wish\s+to\s+unsubscribe/i,
  /you\s+can\s+unsubscribe\s+at\s+any\s+time/i,
];

// Cheerio 1.2 / domhandler element shape
interface DomEl {
  type: string;
  name: string;
  tagName: string; // alias for name in domhandler
  attribs: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asDomEl(el: any): DomEl | null {
  if (el && el.type === 'tag') return el as DomEl;
  return null;
}

function getTagName(el: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = el as any;
  return e?.name || e?.tagName || 'unknown';
}

function getAttribs(el: unknown): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (el as any)?.attribs ?? {};
}

function isUnsubscribeElement($el: cheerio.Cheerio<Element>): boolean {
  const text = $el.text().toLowerCase().trim();
  const href = ($el.attr('href') as string | undefined) ?? '';
  const title = (($el.attr('title') as string | undefined) ?? '').toLowerCase();
  const ariaLabel = (($el.attr('aria-label') as string | undefined) ?? '').toLowerCase();

  return UNSUBSCRIBE_KEYWORDS.some(kw =>
    text.includes(kw) || href.toLowerCase().includes(kw) ||
    title.includes(kw) || ariaLabel.includes(kw)
  );
}

function extractInlineStyle(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr) return result;
  for (const decl of styleStr.split(';')) {
    const [prop, ...vals] = decl.split(':');
    if (prop && vals.length) {
      result[prop.trim().toLowerCase()] = vals.join(':').trim();
    }
  }
  return result;
}

function makeSeverity(ratio: number): Severity {
  if (ratio < 1.5) return 'critical';
  if (ratio < 3) return 'high';
  if (ratio < 4.5) return 'medium';
  return 'low';
}

export function detectUnsubscribePatterns(html: string): DetectedPattern[] {
  const $ = cheerio.load(html);
  const patterns: DetectedPattern[] = [];

  // ── 1. Low contrast ────────────────────────────────────────────────────────
  $('a, button, span, p').each((_i, el) => {
    const $el = $(el);
    if (!isUnsubscribeElement($el)) return;

    const attribs = getAttribs(el);
    const style = extractInlineStyle(attribs['style'] ?? '');
    const color = style['color'] ?? '#000000';
    const bg = style['background-color'] ?? style['background'] ?? '#ffffff';

    const ratio = getContrastRatio(color, bg);
    if (ratio !== null && ratio < 4.5) {
      const tag = getTagName(el);
      const cls = attribs['class'] ?? '';
      patterns.push({
        id: uuidv4(),
        category: 'low_contrast' as PatternCategory,
        severity: makeSeverity(ratio),
        description: `Unsubscribe element has a contrast ratio of ${ratio.toFixed(2)}:1 (WCAG requires 4.5:1 minimum)`,
        element: ($.html($el) ?? '').slice(0, 300),
        selector: tag + (cls ? '.' + cls.split(' ').join('.') : ''),
        details: { contrastRatio: ratio, color, background: bg },
        fixSuggestion: 'Increase text contrast to at least 4.5:1. Use a darker text color or lighter background.',
        fixedElement: ($.html($el) ?? '').replace(/color:[^;"]*/i, 'color: #1a1a1a'),
      });
    }
  });

  // ── 2. Tiny font size ──────────────────────────────────────────────────────
  $('a, button, span').each((_i, el) => {
    const $el = $(el);
    if (!isUnsubscribeElement($el)) return;

    const style = extractInlineStyle(getAttribs(el)['style'] ?? '');
    const fontSize = style['font-size'];
    if (fontSize) {
      const px = parseFloat(fontSize);
      if (!isNaN(px) && px < 10) {
        patterns.push({
          id: uuidv4(),
          category: 'tiny_font',
          severity: px < 7 ? 'critical' : 'high',
          description: `Unsubscribe link has font-size of ${px}px — well below the readable minimum of 10px`,
          element: ($.html($el) ?? '').slice(0, 300),
          selector: getTagName(el),
          details: { fontSize: px },
          fixSuggestion: 'Set font-size to at least 12px for readability.',
          fixedElement: ($.html($el) ?? '').replace(/font-size:[^;"]*/i, 'font-size: 12px'),
        });
      }
    }
  });

  // ── 3. Hidden element ──────────────────────────────────────────────────────
  $('a, button').each((_i, el) => {
    const $el = $(el);
    if (!isUnsubscribeElement($el)) return;

    const style = extractInlineStyle(getAttribs(el)['style'] ?? '');
    const display = style['display'];
    const visibility = style['visibility'];
    const position = style['position'];
    const left = style['left'];
    const top = style['top'];
    const clip = style['clip'];

    const isHidden =
      display === 'none' ||
      visibility === 'hidden' ||
      (position === 'absolute' && (parseFloat(left ?? '0') < -9000 || parseFloat(top ?? '0') < -9000)) ||
      clip === 'rect(0, 0, 0, 0)' || clip === 'rect(0px, 0px, 0px, 0px)';

    if (isHidden) {
      patterns.push({
        id: uuidv4(),
        category: 'hidden_element',
        severity: 'critical',
        description: 'Unsubscribe element is hidden via CSS (display:none, visibility:hidden, or off-screen positioning)',
        element: ($.html($el) ?? '').slice(0, 300),
        selector: getTagName(el),
        details: { display, visibility, position, left, top },
        fixSuggestion: 'Make the unsubscribe link visible. Remove display:none/visibility:hidden.',
        fixedElement: ($.html($el) ?? '')
          .replace(/display\s*:\s*none/i, 'display: inline')
          .replace(/visibility\s*:\s*hidden/i, 'visibility: visible'),
      });
    }
  });

  // ── 4. Near-zero opacity ───────────────────────────────────────────────────
  $('a, button, span').each((_i, el) => {
    const $el = $(el);
    if (!isUnsubscribeElement($el)) return;

    const style = extractInlineStyle(getAttribs(el)['style'] ?? '');
    const opacity = parseFloat(style['opacity'] ?? '1');
    if (!isNaN(opacity) && opacity < 0.3) {
      patterns.push({
        id: uuidv4(),
        category: 'opacity_hidden',
        severity: opacity < 0.1 ? 'critical' : 'high',
        description: `Unsubscribe element has opacity ${opacity} — nearly invisible to users`,
        element: ($.html($el) ?? '').slice(0, 300),
        selector: getTagName(el),
        details: { opacity },
        fixSuggestion: 'Set opacity to 1 for the unsubscribe link.',
        fixedElement: ($.html($el) ?? '').replace(/opacity\s*:\s*[\d.]+/i, 'opacity: 1'),
      });
    }
  });

  // ── 5. No link styling ─────────────────────────────────────────────────────
  $('a').each((_i, el) => {
    const $el = $(el);
    if (!isUnsubscribeElement($el)) return;

    const style = extractInlineStyle(getAttribs(el)['style'] ?? '');
    const textDecoration = style['text-decoration'];
    if (textDecoration === 'none' || textDecoration?.includes('none')) {
      patterns.push({
        id: uuidv4(),
        category: 'no_styling',
        severity: 'medium',
        description: 'Unsubscribe link has text-decoration:none — looks like plain text, not a link',
        element: ($.html($el) ?? '').slice(0, 300),
        selector: 'a',
        details: { textDecoration },
        fixSuggestion: 'Add text-decoration: underline or use a visible button style for the unsubscribe link.',
        fixedElement: ($.html($el) ?? '').replace(/text-decoration\s*:\s*none/i, 'text-decoration: underline'),
      });
    }
  });

  // ── 6. Buried in footer ────────────────────────────────────────────────────
  $('footer, .footer, #footer, [class*="footer"], [id*="footer"]').each((_i, footerEl) => {
    $(footerEl).find('a, button').each((_j, el) => {
      const $el = $(el);
      if (!isUnsubscribeElement($el)) return;
      patterns.push({
        id: uuidv4(),
        category: 'buried_in_footer',
        severity: 'medium',
        description: 'Unsubscribe link is buried in the page footer, making it hard to find',
        element: ($.html($el) ?? '').slice(0, 300),
        selector: 'footer a',
        details: {},
        fixSuggestion: 'Provide a visible unsubscribe option near subscription-related content, not just the footer.',
      });
    });
  });

  // ── 7. Misleading labels ───────────────────────────────────────────────────
  $('a, p, span, div').each((_i, el) => {
    const $el = $(el);
    const text = $el.text();
    for (const pattern of MISLEADING_LABEL_PATTERNS) {
      if (pattern.test(text)) {
        patterns.push({
          id: uuidv4(),
          category: 'misleading_label',
          severity: 'medium',
          description: `Misleading unsubscribe label: "${text.trim().slice(0, 80)}"`,
          element: ($.html($el) ?? '').slice(0, 300),
          selector: getTagName(el),
          details: { matchedPattern: pattern.toString(), text: text.trim().slice(0, 100) },
          fixSuggestion: 'Use a clear, direct "Unsubscribe" label as a visible button or link.',
        });
        break;
      }
    }
  });

  // ── 8. Confirm-shaming ─────────────────────────────────────────────────────
  $('a, button, label, span, p').each((_i, el) => {
    const $el = $(el);
    const text = $el.text();
    for (const pattern of CONFIRM_SHAMING_PATTERNS) {
      if (pattern.test(text)) {
        patterns.push({
          id: uuidv4(),
          category: 'confirm_shaming',
          severity: 'high',
          description: `Confirm-shaming language: "${text.trim().slice(0, 80)}"`,
          element: ($.html($el) ?? '').slice(0, 300),
          selector: getTagName(el),
          details: { text: text.trim().slice(0, 100) },
          fixSuggestion: 'Replace with neutral language like "No thanks" or "Not now".',
          fixedElement: '<span>No thanks</span>',
        });
        break;
      }
    }
  });

  return patterns;
}
