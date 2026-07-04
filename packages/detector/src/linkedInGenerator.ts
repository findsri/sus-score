import { ScanResult, DetectedPattern } from './types';

const SEVERITY_EMOJI: Record<string, string> = {
  critical: '🚨',
  high: '⚠️',
  medium: '🟡',
  low: '💡',
};

export function generateLinkedInPost(result: ScanResult, appUrl = 'https://darkpatterndetector.app'): string {
  const siteName = result.url
    ? new URL(result.url).hostname.replace('www.', '')
    : 'this website';

  const topPatterns = [...result.patterns]
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    })
    .slice(0, 3);

  const opener = result.susScore >= 70
    ? `🚫 I scanned ${siteName} and found ${result.totalPatterns} dark patterns. Here's what they don't want you to see 👇`
    : result.susScore >= 40
    ? `⚠️ I scanned ${siteName} and uncovered ${result.totalPatterns} suspicious UX patterns. Thread 👇`
    : `🔍 I ran a dark pattern audit on ${siteName}. Here's the full breakdown 👇`;

  const scoreSection = `\n\n🎯 Sus Score: ${result.susScore}/100\n${'█'.repeat(Math.round(result.susScore / 10))}${'░'.repeat(10 - Math.round(result.susScore / 10))} ${result.susScore}%`;

  const patternLines = topPatterns.map((p, i) =>
    `\n${i + 1}. ${SEVERITY_EMOJI[p.severity]} ${formatCategory(p.category)}\n   "${p.description.slice(0, 100)}"`
  ).join('\n');

  const patternsSection = topPatterns.length > 0
    ? `\n\nTop dark patterns found:\n${patternLines}`
    : '\n\nNo major dark patterns detected — a rare ethical win! 🎉';

  const cta = `\n\n👉 Try the scanner yourself: ${appUrl}\n\nScan your own site and see where you land on the Sus Score.`;

  const hashtags = `\n\n#DarkPatterns #UX #Ethics #WebDesign #AI #Accessibility #UserExperience #DesignEthics`;

  return opener + scoreSection + patternsSection + cta + hashtags;
}

function formatCategory(cat: string): string {
  const labels: Record<string, string> = {
    low_contrast: 'Low Contrast Unsubscribe Link',
    tiny_font: 'Tiny Font Size on Opt-out',
    hidden_element: 'Hidden Unsubscribe Element',
    no_styling: 'Unstyled (Invisible) Unsubscribe Link',
    off_screen: 'Off-Screen Unsubscribe Button',
    misleading_label: 'Misleading Label / Trick Question',
    confirm_shaming: 'Confirm-Shaming Language',
    buried_in_footer: 'Unsubscribe Buried in Footer',
    opacity_hidden: 'Near-Invisible Opacity on Opt-out',
  };
  return labels[cat] ?? cat;
}
