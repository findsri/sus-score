import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const leaderboardRouter = Router();

// Hall of Shame leaderboard
leaderboardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        domain,
        latest_evil_score,
        worst_score,
        best_score,
        scan_count,
        last_scanned_at,
        created_at
      FROM hall_of_shame
      ORDER BY latest_evil_score DESC
      LIMIT 50
    `);
    return res.json({ entries: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// Timeline for a specific domain
leaderboardRouter.get('/timeline/:domain', async (req: Request, res: Response) => {
  const { domain } = req.params;
  try {
    const result = await pool.query(`
      SELECT evil_score, total_patterns, scanned_at
      FROM timeline_scans
      WHERE domain = $1
      ORDER BY scanned_at ASC
      LIMIT 100
    `, [domain]);
    return res.json({ domain, timeline: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// Recent scans (public feed)
leaderboardRouter.get('/recent', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, url, evil_score, total_patterns, is_email, created_at
      FROM scans
      WHERE url IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);
    return res.json({ scans: result.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});
