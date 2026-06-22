export type PatternCategory =
  | 'low_contrast'
  | 'tiny_font'
  | 'hidden_element'
  | 'no_styling'
  | 'off_screen'
  | 'misleading_label'
  | 'confirm_shaming'
  | 'buried_in_footer'
  | 'opacity_hidden';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DetectedPattern {
  id: string;
  category: PatternCategory;
  severity: Severity;
  description: string;
  element: string;       // outerHTML snippet
  selector: string;      // CSS selector or xpath hint
  details: Record<string, unknown>;
  fixSuggestion: string;
  fixedElement?: string; // corrected HTML snippet
}

export interface ScanResult {
  url?: string;
  scannedAt: string;
  evilScore: number;          // 0–100
  scoreBreakdown: Record<PatternCategory, number>;
  patterns: DetectedPattern[];
  totalPatterns: number;
  screenshotBase64?: string;  // original page screenshot
  cleanScreenshotBase64?: string;
  linkedInPost?: string;
}

export interface ScanInput {
  html: string;
  url?: string;
  isEmail?: boolean;
}
