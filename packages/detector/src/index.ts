export { detectUnsubscribePatterns } from './detectors/unsubscribeDetector';
export { detectGeneralDarkPatterns } from './detectors/generalDarkPatterns';
export { calculateSusScore } from './utils/scoring';
export { generateLinkedInPost } from './linkedInGenerator';
export { generateFixedHtml } from './fixGenerator';
export * from './types';

import { detectUnsubscribePatterns } from './detectors/unsubscribeDetector';
import { detectGeneralDarkPatterns } from './detectors/generalDarkPatterns';
import { calculateSusScore } from './utils/scoring';
import { generateLinkedInPost } from './linkedInGenerator';
import { generateFixedHtml } from './fixGenerator';
import { ScanInput, ScanResult } from './types';

export async function scan(input: ScanInput): Promise<ScanResult> {
  const { html, url, isEmail = false } = input;

  const unsubscribePatterns = detectUnsubscribePatterns(html);
  const generalPatterns = isEmail ? [] : detectGeneralDarkPatterns(html);
  const allPatterns = [...unsubscribePatterns, ...generalPatterns];

  const { susScore, breakdown } = calculateSusScore(allPatterns);
  const linkedInPost = generateLinkedInPost({ url, susScore, patterns: allPatterns, totalPatterns: allPatterns.length, scannedAt: new Date().toISOString(), scoreBreakdown: breakdown });

  return {
    url,
    scannedAt: new Date().toISOString(),
    susScore,
    scoreBreakdown: breakdown,
    patterns: allPatterns,
    totalPatterns: allPatterns.length,
    linkedInPost,
  };
}
