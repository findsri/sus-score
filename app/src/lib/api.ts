import axios from 'axios';
import { ScanResult } from '@dark-pattern-detector/detector';

// Express backend (optional — used for screenshots, DB persistence, leaderboard)
const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const expressApi = axios.create({
  baseURL: EXPRESS_URL,
  timeout: 60000,
});

export interface ScanResponse extends ScanResult {
  scanId: string;
  screenshotBase64?: string;
  cleanScreenshotBase64?: string;
  diff?: Array<{ original: string; fixed: string; description: string }>;
}

export async function runScan(params: {
  url?: string;
  html?: string;
  isEmail?: boolean;
  takeScreenshot?: boolean;
}): Promise<ScanResponse> {
  // Always try the built-in Next.js API route first — works with no backend
  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Scan failed with status ${res.status}`);
    }
    return await res.json() as ScanResponse;
  } catch (err) {
    // If the Next.js route itself errored (not a fetch/network error), rethrow
    if (err instanceof Error && !err.message.includes('fetch')) {
      throw err;
    }
    // Fallback to Express backend if running
    const { data } = await expressApi.post<ScanResponse>('/api/scan', params);
    return data;
  }
}

export async function getScan(id: string): Promise<ScanResponse> {
  const res = await fetch(`/api/scan/${id}`);
  if (!res.ok) throw new Error('Scan not found');
  return res.json() as Promise<ScanResponse>;
}

export interface LeaderboardEntry {
  domain: string;
  latest_evil_score: number;
  worst_score: number;
  best_score: number;
  scan_count: number;
  last_scanned_at: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await expressApi.get<{ entries: LeaderboardEntry[] }>('/api/leaderboard');
  return data.entries;
}

export interface TimelineEntry {
  evil_score: number;
  total_patterns: number;
  scanned_at: string;
}

export async function getTimeline(domain: string): Promise<TimelineEntry[]> {
  const { data } = await expressApi.get<{ domain: string; timeline: TimelineEntry[] }>(
    `/api/leaderboard/timeline/${encodeURIComponent(domain)}`
  );
  return data.timeline;
}

export async function getRecentScans() {
  const { data } = await expressApi.get('/api/leaderboard/recent');
  return data.scans;
}
