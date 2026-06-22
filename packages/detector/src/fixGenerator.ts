import * as cheerio from 'cheerio';
import { DetectedPattern } from './types';

export function generateFixedHtml(
  originalHtml: string,
  patterns: DetectedPattern[]
): { cleanedHtml: string; diff: Array<{ original: string; fixed: string; description: string }> } {
  const $ = cheerio.load(originalHtml);
  const diff: Array<{ original: string; fixed: string; description: string }> = [];

  for (const pattern of patterns) {
    if (!pattern.fixedElement || pattern.fixedElement === pattern.element) continue;
    diff.push({
      original: pattern.element,
      fixed: pattern.fixedElement,
      description: pattern.fixSuggestion,
    });
  }

  // Apply generic CSS fixes inline
  $('a, button').each((_i, el) => {
    const $el = $(el);
    const style = $el.attr('style') ?? '';
    const text = $el.text().toLowerCase();
    if (/unsubscribe|opt.?out|cancel/.test(text)) {
      if (/display\s*:\s*none/i.test(style)) {
        $el.attr('style', style.replace(/display\s*:\s*none/gi, 'display: inline'));
      }
      const opacityMatch = style.match(/opacity\s*:\s*([\d.]+)/i);
      if (opacityMatch && parseFloat(opacityMatch[1]) < 0.3) {
        $el.attr('style', style.replace(/opacity\s*:\s*[\d.]+/i, 'opacity: 1'));
      }
    }
  });

  $('a').each((_i, el) => {
    const $el = $(el);
    const style = $el.attr('style') ?? '';
    const text = $el.text().toLowerCase();
    if (/unsubscribe|opt.?out|cancel/.test(text) && /text-decoration\s*:\s*none/i.test(style)) {
      $el.attr('style', style.replace(/text-decoration\s*:\s*none/gi, 'text-decoration: underline'));
    }
  });

  return { cleanedHtml: $.html(), diff };
}
