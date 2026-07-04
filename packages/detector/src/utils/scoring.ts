import { DetectedPattern, PatternCategory, Severity } from '../types';

const SEVERITY_WEIGHTS: Record<Severity, number> = {
  low: 3,
  medium: 8,
  high: 15,
  critical: 25,
};

const CATEGORY_MAX: Record<PatternCategory, number> = {
  low_contrast: 25,
  tiny_font: 15,
  hidden_element: 20,
  no_styling: 10,
  off_screen: 20,
  misleading_label: 15,
  confirm_shaming: 20,
  buried_in_footer: 10,
  opacity_hidden: 20,
};

export function calculateSusScore(patterns: DetectedPattern[]): {
  susScore: number;
  breakdown: Record<PatternCategory, number>;
} {
  const breakdown: Partial<Record<PatternCategory, number>> = {};

  for (const pattern of patterns) {
    const weight = SEVERITY_WEIGHTS[pattern.severity];
    const max = CATEGORY_MAX[pattern.category];
    const current = breakdown[pattern.category] ?? 0;
    breakdown[pattern.category] = Math.min(current + weight, max);
  }

  const totalMax = Object.values(CATEGORY_MAX).reduce((a, b) => a + b, 0);
  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const susScore = Math.min(Math.round((totalScore / totalMax) * 100), 100);

  // Fill in zeroes for missing categories
  const fullBreakdown = Object.fromEntries(
    (Object.keys(CATEGORY_MAX) as PatternCategory[]).map(cat => [
      cat,
      breakdown[cat] ?? 0,
    ])
  ) as Record<PatternCategory, number>;

  return { susScore, breakdown: fullBreakdown };
}
