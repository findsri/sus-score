import { ScanResponse } from './api';

export const DEMO_SCANS: Record<string, ScanResponse> = {
  'booking.com': {
    scanId: 'demo-booking',
    url: 'https://booking.com',
    scannedAt: new Date().toISOString(),
    evilScore: 82,
    totalPatterns: 11,
    scoreBreakdown: {
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
        id: 'p1', category: 'confirm_shaming', severity: 'high',
        description: '"No thanks, I prefer paying more" — decline button on discount popup',
        element: '<a style="font-size:11px;color:#999">No thanks, I prefer paying more</a>',
        selector: 'a', details: { text: 'No thanks, I prefer paying more' },
        fixSuggestion: 'Replace with neutral "No thanks" or "Not now".',
        fixedElement: '<a style="font-size:14px;color:#333;text-decoration:underline">No thanks</a>',
      },
      {
        id: 'p2', category: 'misleading_label', severity: 'high',
        description: '"Only 2 rooms left at this price!" shown persistently regardless of actual availability',
        element: '<span class="urgency-label">Only 2 rooms left at this price!</span>',
        selector: '.urgency-label',
        details: { text: 'Only 2 rooms left at this price!' },
        fixSuggestion: 'Only display real-time availability counts that are accurate.',
      },
      {
        id: 'p3', category: 'misleading_label', severity: 'high',
        description: 'Pre-ticked "Send me deals and special offers by email" checkbox during checkout',
        element: '<input type="checkbox" checked name="marketing"> Send me deals and special offers by email',
        selector: 'input[type="checkbox"][checked]',
        details: { label: 'Send me deals and special offers by email' },
        fixSuggestion: 'Marketing opt-in checkboxes must be unchecked by default (GDPR Article 7).',
        fixedElement: '<input type="checkbox" name="marketing"> Send me deals and special offers by email',
      },
      {
        id: 'p4', category: 'tiny_font', severity: 'high',
        description: 'Email preferences link uses 8px font — far below readable minimum of 12px',
        element: '<a href="/preferences" style="font-size:8px;color:#ccc">Manage email preferences</a>',
        selector: 'a[href*="preferences"]',
        details: { fontSize: 8 },
        fixSuggestion: 'Set font-size to at least 12px for all actionable links.',
        fixedElement: '<a href="/preferences" style="font-size:12px;color:#555;text-decoration:underline">Manage email preferences</a>',
      },
      {
        id: 'p5', category: 'buried_in_footer', severity: 'medium',
        description: 'Unsubscribe from marketing emails only accessible via footer — buried below dozens of links',
        element: '<footer><small><a href="/unsubscribe">Unsubscribe</a></small></footer>',
        selector: 'footer a',
        details: {},
        fixSuggestion: 'Provide unsubscribe access in account settings, not only the footer.',
      },
      {
        id: 'p6', category: 'low_contrast', severity: 'high',
        description: 'Unsubscribe link has contrast ratio of 1.8:1 — WCAG requires 4.5:1 minimum',
        element: '<a href="/unsubscribe" style="color:#aaaaaa;background:#ffffff;font-size:10px">Unsubscribe</a>',
        selector: 'a[href*="unsubscribe"]',
        details: { contrastRatio: 1.8, color: '#aaaaaa', background: '#ffffff' },
        fixSuggestion: 'Change text color to #555555 or darker to achieve 4.5:1 contrast.',
        fixedElement: '<a href="/unsubscribe" style="color:#444444;font-size:12px;text-decoration:underline">Unsubscribe</a>',
      },
    ],
    diff: [
      {
        original: '<a style="font-size:11px;color:#999">No thanks, I prefer paying more</a>',
        fixed: '<a style="font-size:14px;color:#333;text-decoration:underline">No thanks</a>',
        description: 'Remove confirm-shaming language — replace with neutral "No thanks"',
      },
      {
        original: '<a href="/unsubscribe" style="color:#aaaaaa;font-size:10px">Unsubscribe</a>',
        fixed: '<a href="/unsubscribe" style="color:#444444;font-size:12px;text-decoration:underline">Unsubscribe</a>',
        description: 'Fix contrast ratio from 1.8:1 to 7.2:1 and increase font size to 12px',
      },
      {
        original: '<input type="checkbox" checked name="marketing">',
        fixed: '<input type="checkbox" name="marketing">',
        description: 'Remove pre-checked state from marketing opt-in checkbox (GDPR compliance)',
      },
    ],
    linkedInPost: `🚫 I scanned booking.com and found 11 dark patterns. Here's what they don't want you to see 👇\n\n🎯 Evil Score: 82/100\n████████░░ 82%\n\nTop dark patterns found:\n\n1. 🚨 Confirm-Shaming: "No thanks, I prefer paying more"\n\n2. ⚠️ Fake Scarcity: "Only 2 rooms left!" — shown regardless of availability\n\n3. ⚠️ Pre-ticked marketing email checkbox during checkout\n\nThis is not a bug. It's intentional design to trap users.\n\n👉 Try the scanner: https://github.com/findsri/dark-pattern-detector\n\n#DarkPatterns #UX #Ethics #WebDesign #AI #Accessibility`,
  },

  'linkedin.com': {
    scanId: 'demo-linkedin',
    url: 'https://linkedin.com',
    scannedAt: new Date().toISOString(),
    evilScore: 74,
    totalPatterns: 9,
    scoreBreakdown: {
      low_contrast: 12,
      tiny_font: 8,
      hidden_element: 0,
      no_styling: 8,
      off_screen: 0,
      misleading_label: 15,
      confirm_shaming: 16,
      buried_in_footer: 8,
      opacity_hidden: 0,
    },
    patterns: [
      {
        id: 'lp1', category: 'confirm_shaming', severity: 'high',
        description: '"No thanks, I don\'t want to grow my network" — cancel button on connection nudge',
        element: '<span class="decline-cta">No thanks, I don\'t want to grow my network</span>',
        selector: '.decline-cta',
        details: { text: "No thanks, I don't want to grow my network" },
        fixSuggestion: 'Replace with a neutral "Not now" or "Skip" option.',
        fixedElement: '<span class="decline-cta">Not now</span>',
      },
      {
        id: 'lp2', category: 'misleading_label', severity: 'high',
        description: 'Email notifications opt-out requires navigating 6 separate settings pages',
        element: '<a href="/settings/communications">Manage all notifications</a>',
        selector: 'a[href*="communications"]',
        details: { clicksRequired: 6 },
        fixSuggestion: 'Provide a single "Unsubscribe from all" option in the first settings screen.',
      },
      {
        id: 'lp3', category: 'misleading_label', severity: 'high',
        description: 'Pre-ticked "Allow LinkedIn to use my data for advertising" during onboarding',
        element: '<input type="checkbox" checked name="ad-personalization"> Allow LinkedIn to personalise ads using my activity',
        selector: 'input[name="ad-personalization"]',
        details: { label: 'Allow LinkedIn to personalise ads using my activity' },
        fixSuggestion: 'Data personalisation checkboxes must default to unchecked under GDPR.',
        fixedElement: '<input type="checkbox" name="ad-personalization"> Allow LinkedIn to personalise ads using my activity',
      },
      {
        id: 'lp4', category: 'low_contrast', severity: 'medium',
        description: 'Unsubscribe from digest emails link has 2.1:1 contrast ratio',
        element: '<a style="color:#b0b0b0;font-size:11px">Unsubscribe from weekly digest</a>',
        selector: 'a',
        details: { contrastRatio: 2.1 },
        fixSuggestion: 'Increase contrast to at least 4.5:1.',
      },
    ],
    diff: [
      {
        original: '<span class="decline-cta">No thanks, I don\'t want to grow my network</span>',
        fixed: '<span class="decline-cta">Not now</span>',
        description: 'Remove confirm-shaming — replace with neutral dismissal',
      },
    ],
    linkedInPost: `👀 I scanned linkedin.com itself for dark patterns. The irony is real 👇\n\n🎯 Evil Score: 74/100\n███████░░░ 74%\n\nTop patterns found on LinkedIn:\n\n1. 🚨 Confirm-Shaming: "No thanks, I don't want to grow my network"\n2. ⚠️ 6 clicks to turn off email notifications\n3. ⚠️ Pre-ticked advertising data checkbox during onboarding\n\nA platform built for professionals using the same tricks as clickbait sites.\n\n👉 Scan any site yourself: https://github.com/findsri/dark-pattern-detector\n\n#DarkPatterns #LinkedIn #UX #Ethics #WebDesign`,
  },

  'github.com': {
    scanId: 'demo-github',
    url: 'https://github.com',
    scannedAt: new Date().toISOString(),
    evilScore: 8,
    totalPatterns: 1,
    scoreBreakdown: {
      low_contrast: 0, tiny_font: 0, hidden_element: 0, no_styling: 8,
      off_screen: 0, misleading_label: 0, confirm_shaming: 0,
      buried_in_footer: 0, opacity_hidden: 0,
    },
    patterns: [
      {
        id: 'gp1', category: 'no_styling', severity: 'low',
        description: 'Email preferences link in footer uses text-decoration:none — looks like plain text',
        element: '<a href="/notifications/unsubscribe" style="text-decoration:none;color:#6a737d">Unsubscribe</a>',
        selector: 'footer a',
        details: { textDecoration: 'none' },
        fixSuggestion: 'Add underline or button style to make the link visually distinct.',
        fixedElement: '<a href="/notifications/unsubscribe" style="text-decoration:underline;color:#0366d6">Unsubscribe</a>',
      },
    ],
    diff: [
      {
        original: '<a href="/notifications/unsubscribe" style="text-decoration:none;color:#6a737d">Unsubscribe</a>',
        fixed: '<a href="/notifications/unsubscribe" style="text-decoration:underline;color:#0366d6">Unsubscribe</a>',
        description: 'Add underline to make unsubscribe link visually distinct from plain text',
      },
    ],
    linkedInPost: `✅ I scanned github.com for dark patterns.\n\n🎯 Evil Score: 8/100\n░░░░░░░░░░ 8%\n\nResult: Nearly clean. Just one minor issue — an unsubscribe link with no underline styling.\n\nThis is what ethical UX looks like. GitHub sets the bar.\n\nNot every company tries to trap you. Some are actually building for users.\n\n👉 See how your site scores: https://github.com/findsri/dark-pattern-detector\n\n#DarkPatterns #UX #Ethics #GitHub #WebDesign`,
  },
};

export function getDemoScan(url: string): ScanResponse | null {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return DEMO_SCANS[domain] ?? null;
  } catch {
    return null;
  }
}
