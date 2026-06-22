import * as cheerio from 'cheerio';
import { DetectedPattern } from '../types';
import { v4 as uuidv4 } from 'uuid';

function getTagName(el: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = el as any;
  return e?.name || e?.tagName || 'unknown';
}

function getAttribs(el: unknown): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (el as any)?.attribs ?? {};
}

export function detectGeneralDarkPatterns(html: string): DetectedPattern[] {
  const $ = cheerio.load(html);
  const patterns: DetectedPattern[] = [];

  // Pre-ticked marketing checkboxes
  $('input[type="checkbox"][checked]').each((_i, el) => {
    const $el = $(el);
    const label = $el.closest('label').text() || getAttribs(el)['name'] || '';
    if (/newsletter|email|offer|promotion|partner|third.party|marketing/i.test(label)) {
      patterns.push({
        id: uuidv4(),
        category: 'misleading_label',
        severity: 'high',
        description: `Pre-ticked marketing checkbox: "${label.trim().slice(0, 80)}"`,
        element: ($.html($el) ?? '').slice(0, 300),
        selector: 'input[type="checkbox"][checked]',
        details: { label: label.trim() },
        fixSuggestion: 'Opt-in checkboxes must be unchecked by default (GDPR requirement).',
        fixedElement: ($.html($el) ?? '').replace(/\s+checked(="")?/i, ''),
      });
    }
  });

  // Countdown timers (false urgency)
  $('[class*="countdown"], [id*="countdown"], [class*="timer"], [id*="timer"]').each((_i, el) => {
    const $el = $(el);
    const attribs = getAttribs(el);
    const cls = attribs['class'] ?? '';
    patterns.push({
      id: uuidv4(),
      category: 'misleading_label',
      severity: 'medium',
      description: 'Countdown timer detected — may create artificial urgency',
      element: ($.html($el) ?? '').slice(0, 300),
      selector: getTagName(el) + (cls ? '.' + cls.split(' ')[0] : ''),
      details: {},
      fixSuggestion: 'Only use countdown timers for genuine limited-time offers.',
    });
  });

  // Artificial scarcity claims
  $('span, p, div').each((_i, el) => {
    const $el = $(el);
    const text = $el.text();
    if (/only\s+\d+\s+(left|remaining|in\s+stock)/i.test(text) || /\d+\s+people\s+viewing/i.test(text)) {
      patterns.push({
        id: uuidv4(),
        category: 'misleading_label',
        severity: 'low',
        description: `Artificial scarcity message: "${text.trim().slice(0, 80)}"`,
        element: ($.html($el) ?? '').slice(0, 300),
        selector: getTagName(el),
        details: { text: text.trim().slice(0, 100) },
        fixSuggestion: 'Only display real stock or viewer counts if they are accurate.',
      });
    }
  });

  // Disguised ads
  $('a[class*="sponsored"], a[class*="ad-"], [data-ad]').each((_i, el) => {
    const $el = $(el);
    const hasNoLabel = $el.find('span, div, small').filter((_j, child) =>
      /^(ad|sponsored|promoted)$/i.test($(child).text().trim())
    ).length === 0;

    if (hasNoLabel) {
      patterns.push({
        id: uuidv4(),
        category: 'misleading_label',
        severity: 'medium',
        description: 'Disguised advertisement — paid content not clearly labeled',
        element: ($.html($el) ?? '').slice(0, 300),
        selector: getTagName(el) + '[class*="sponsored"]',
        details: {},
        fixSuggestion: 'Clearly label all sponsored content with "Ad", "Sponsored", or "Promoted".',
      });
    }
  });

  return patterns;
}
