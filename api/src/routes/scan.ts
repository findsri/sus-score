import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { scan, generateFixedHtml } from '@sus-score/detector';
import { screenshotUrl, screenshotHtml } from '../screenshot';
import { pool, upsertHallOfShame, insertTimelineScan } from '../db';

export const scanRouter = Router();

const ScanBodySchema = z.object({
  url: z.string().url().optional(),
  html: z.string().optional(),
  isEmail: z.boolean().optional().default(false),
  takeScreenshot: z.boolean().optional().default(false),
}).refine(data => data.url || data.html, {
  message: 'Either url or html is required',
});

scanRouter.post('/', async (req: Request, res: Response) => {
  const parsed = ScanBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { url, html: rawHtml, isEmail, takeScreenshot } = parsed.data;

  try {
    let pageHtml = rawHtml ?? '';
    let screenshotBase64: string | undefined;

    // If URL provided, optionally take a screenshot and get page HTML
    if (url) {
      if (takeScreenshot) {
        try {
          const { original, pageHtml: fetchedHtml } = await screenshotUrl(url);
          screenshotBase64 = original;
          pageHtml = fetchedHtml;
        } catch (err) {
          console.warn('Screenshot failed, falling back to fetch:', err);
          // Fallback: just fetch HTML without screenshot
          const axios = (await import('axios')).default;
          const resp = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DarkPatternBot/1.0)' } });
          pageHtml = resp.data as string;
        }
      } else {
        const axios = (await import('axios')).default;
        const resp = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DarkPatternBot/1.0)' } });
        pageHtml = resp.data as string;
      }
    }

    if (!pageHtml) {
      return res.status(400).json({ error: 'Could not retrieve HTML content' });
    }

    // Run detector
    const result = await scan({ html: pageHtml, url, isEmail });

    // Generate fixed HTML
    const { cleanedHtml, diff } = generateFixedHtml(pageHtml, result.patterns);

    // Screenshot the cleaned HTML
    let cleanScreenshotBase64: string | undefined;
    if (screenshotBase64) {
      try {
        cleanScreenshotBase64 = await screenshotHtml(cleanedHtml);
      } catch {
        // non-fatal
      }
    }

    // Persist to DB
    const dbResult = await pool.query(`
      INSERT INTO scans (url, sus_score, total_patterns, score_breakdown, patterns, screenshot_base64, clean_screenshot_base64, linkedin_post, is_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      url ?? null,
      result.susScore,
      result.totalPatterns,
      JSON.stringify(result.scoreBreakdown),
      JSON.stringify(result.patterns),
      screenshotBase64 ?? null,
      cleanScreenshotBase64 ?? null,
      result.linkedInPost ?? null,
      isEmail,
    ]);

    const scanId = dbResult.rows[0].id as string;

    // Update Hall of Shame and timeline if URL was provided
    if (url) {
      try {
        const domain = new URL(url).hostname.replace('www.', '');
        await upsertHallOfShame(domain, result.susScore);
        await insertTimelineScan(domain, result.susScore, result.totalPatterns, scanId);
      } catch (err) {
        console.warn('Hall of shame update failed:', err);
      }
    }

    return res.json({
      scanId,
      ...result,
      screenshotBase64,
      cleanScreenshotBase64,
      diff,
    });
  } catch (err: unknown) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
});

scanRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    const row = result.rows[0];
    return res.json({
      scanId: row.id,
      url: row.url,
      susScore: row.sus_score,
      totalPatterns: row.total_patterns,
      scoreBreakdown: row.score_breakdown,
      patterns: row.patterns,
      screenshotBase64: row.screenshot_base64,
      cleanScreenshotBase64: row.clean_screenshot_base64,
      linkedInPost: row.linkedin_post,
      scannedAt: row.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});
