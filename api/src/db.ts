import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS scans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT,
      sus_score INTEGER NOT NULL,
      total_patterns INTEGER NOT NULL,
      score_breakdown JSONB NOT NULL DEFAULT '{}',
      patterns JSONB NOT NULL DEFAULT '[]',
      screenshot_base64 TEXT,
      clean_screenshot_base64 TEXT,
      linkedin_post TEXT,
      is_email BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hall_of_shame (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain TEXT UNIQUE NOT NULL,
      latest_sus_score INTEGER NOT NULL,
      scan_count INTEGER DEFAULT 1,
      worst_score INTEGER NOT NULL,
      best_score INTEGER NOT NULL,
      last_scanned_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS timeline_scans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain TEXT NOT NULL,
      sus_score INTEGER NOT NULL,
      total_patterns INTEGER NOT NULL,
      scanned_at TIMESTAMPTZ DEFAULT NOW(),
      scan_id UUID REFERENCES scans(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scans_url ON scans(url);
    CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_hall_of_shame_score ON hall_of_shame(latest_sus_score DESC);
    CREATE INDEX IF NOT EXISTS idx_timeline_domain ON timeline_scans(domain, scanned_at DESC);
  `);
  console.log('Database initialized');
}

export async function upsertHallOfShame(domain: string, susScore: number): Promise<void> {
  await pool.query(`
    INSERT INTO hall_of_shame (domain, latest_sus_score, worst_score, best_score)
    VALUES ($1, $2, $2, $2)
    ON CONFLICT (domain) DO UPDATE SET
      latest_sus_score = $2,
      worst_score = GREATEST(hall_of_shame.worst_score, $2),
      best_score = LEAST(hall_of_shame.best_score, $2),
      scan_count = hall_of_shame.scan_count + 1,
      last_scanned_at = NOW()
  `, [domain, susScore]);
}

export async function insertTimelineScan(domain: string, susScore: number, totalPatterns: number, scanId: string): Promise<void> {
  await pool.query(`
    INSERT INTO timeline_scans (domain, sus_score, total_patterns, scan_id)
    VALUES ($1, $2, $3, $4)
  `, [domain, susScore, totalPatterns, scanId]);
}
