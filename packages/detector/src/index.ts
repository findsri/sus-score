export { detectUnsubscribePatterns } from './detectors/unsubscribeDetector';
export { detectGeneralDarkPatterns } from './detectors/generalDarkPatterns';
export { calculateEvilScore } from './utils/scoring';
export { generateLinkedInPost } from './linkedInGenerator';
export { generateFixedHtml } from './fixGenerator';
export * from './types';

import { detectUnsubscribePatterns } from './detectors/unsubscribeDetector';
import { detectGeneralDarkPatterns } from './detectors/generalDarkPatterns';
import { calculateEvilScore } from './utils/scoring';
import { generateLinkedInPost } from './linkedInGenerator';
import { generateFixedHtml } from './fixGenerator';
import { ScanInput, ScanResult } from './types';

export async function scan(input: ScanInput): Promise<ScanResult> {
  const { html, url, isEmail = false } = input;

  const unsubscribePatterns = detectUnsubscribePatterns(html);
  const generalPatterns = isEmail ? [] : detectGeneralDarkPatterns(html);
  const allPatterns = [...unsubscribePatterns, ...generalPatterns];

  const { evilScore, breakdown } = calculateEvilScore(allPatterns);
  const linkedInPost = generateLinkedInPost({ url, evilScore, patterns: allPatterns, totalPatterns: allPatterns.length, scannedAt: new Date().toISOString(), scoreBreakdown: breakdown });

  return {
    url,
    scannedAt: new Date().toISOString(),
    evilScore,
    scoreBreakdown: breakdown,
    patterns: allPatterns,
    totalPatterns: allPatterns.length,
    linkedInPost,
  };
}
