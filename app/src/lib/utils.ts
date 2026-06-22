import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  if (score >= 20) return '#eab308';
  return '#10b981';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Extremely Evil';
  if (score >= 60) return 'Very Manipulative';
  if (score >= 40) return 'Somewhat Shady';
  if (score >= 20) return 'Minor Issues';
  return 'Mostly Clean';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#eab308';
    case 'low': return '#10b981';
    default: return '#6b7280';
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    low_contrast: 'Low Contrast',
    tiny_font: 'Tiny Font',
    hidden_element: 'Hidden Element',
    no_styling: 'No Link Styling',
    off_screen: 'Off-Screen',
    misleading_label: 'Misleading Label',
    confirm_shaming: 'Confirm Shaming',
    buried_in_footer: 'Buried in Footer',
    opacity_hidden: 'Opacity Hidden',
  };
  return labels[category] ?? category;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
