import axios from 'axios';
import { ScanResult } from '@dark-pattern-detector/detector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
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
  const { data } = await api.post<ScanResponse>('/api/scan', params);
  return data;
}

export async function getScan(id: string): Promise<ScanResponse> {
  const { data } = await api.get<ScanResponse>(`/api/scan/${id}`);
  return data;
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
  const { data } = await api.get<{ entries: LeaderboardEntry[] }>('/api/leaderboard');
  return data.entries;
}

export interface TimelineEntry {
  evil_score: number;
  total_patterns: number;
  scanned_at: string;
}

export async function getTimeline(domain: string): Promise<TimelineEntry[]> {
  const { data } = await api.get<{ domain: string; timeline: TimelineEntry[] }>(
    `/api/leaderboard/timeline/${encodeURIComponent(domain)}`
  );
  return data.timeline;
}

export async function getRecentScans() {
  const { data } = await api.get('/api/leaderboard/recent');
  return data.scans;
}
