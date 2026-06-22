'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api';
import { getScoreColor, getScoreLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Demo seed data (shown when API is unavailable)
const SEED_DATA: LeaderboardEntry[] = [
  { domain: 'amazon.com', latest_evil_score: 82, worst_score: 87, best_score: 75, scan_count: 142, last_scanned_at: new Date().toISOString() },
  { domain: 'linkedin.com', latest_evil_score: 74, worst_score: 78, best_score: 65, scan_count: 98, last_scanned_at: new Date().toISOString() },
  { domain: 'booking.com', latest_evil_score: 71, worst_score: 76, best_score: 60, scan_count: 67, last_scanned_at: new Date().toISOString() },
  { domain: 'ticketmaster.com', latest_evil_score: 68, worst_score: 72, best_score: 55, scan_count: 45, last_scanned_at: new Date().toISOString() },
  { domain: 'tripadvisor.com', latest_evil_score: 64, worst_score: 68, best_score: 50, scan_count: 39, last_scanned_at: new Date().toISOString() },
  { domain: 'hotels.com', latest_evil_score: 61, worst_score: 65, best_score: 48, scan_count: 31, last_scanned_at: new Date().toISOString() },
  { domain: 'quora.com', latest_evil_score: 55, worst_score: 60, best_score: 45, scan_count: 28, last_scanned_at: new Date().toISOString() },
  { domain: 'forbes.com', latest_evil_score: 49, worst_score: 55, best_score: 40, scan_count: 22, last_scanned_at: new Date().toISOString() },
  { domain: 'reddit.com', latest_evil_score: 23, worst_score: 28, best_score: 18, scan_count: 88, last_scanned_at: new Date().toISOString() },
  { domain: 'github.com', latest_evil_score: 8, worst_score: 12, best_score: 5, scan_count: 120, last_scanned_at: new Date().toISOString() },
];

function ScoreBadge({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <div
      className="inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg"
      style={{ backgroundColor: `${color}20`, color }}
      aria-label={`Evil score ${score}`}
    >
      {score}
    </div>
  );
}

function TrendIndicator({ latest, worst, best }: { latest: number; worst: number; best: number }) {
  const mid = (worst + best) / 2;
  if (latest > mid + 2) return <TrendingUp className="w-4 h-4 text-danger" title="Getting worse" />;
  if (latest < mid - 2) return <TrendingDown className="w-4 h-4 text-success" title="Improving" />;
  return <Minus className="w-4 h-4 text-muted" title="Stable" />;
}

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(SEED_DATA);
  const [loading, setLoading] = useState(true);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(data => {
        if (data.length > 0) {
          setEntries(data);
          setUsingLiveData(true);
        }
      })
      .catch(() => {/* use seed data */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-full px-3 py-1 text-xs text-warning mb-4">
          <Trophy className="w-3.5 h-3.5" />
          Community Hall of Shame
        </div>
        <h1 className="text-3xl font-extrabold mb-3">The <span className="gradient-text">Most Manipulative</span> Websites</h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Ranked by Evil Score. Community-sourced and auto-updated every time someone scans a site.
          {!usingLiveData && !loading && (
            <span className="text-muted ml-1 text-xs">(Showing demo data — connect a database to see live results)</span>
          )}
        </p>
      </motion.div>

      {/* Leaderboard table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[48px_1fr_120px_100px_80px] gap-0 border-b border-border text-xs text-muted px-5 py-3 font-semibold uppercase tracking-wider">
          <div>#</div>
          <div>Website</div>
          <div className="text-center">Evil Score</div>
          <div className="text-center">Worst/Best</div>
          <div className="text-center">Scans</div>
        </div>

        {entries.map((entry, i) => (
          <motion.div
            key={entry.domain}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              'grid grid-cols-[48px_1fr_120px_100px_80px] gap-0 items-center px-5 py-4',
              'border-b border-border last:border-0 hover:bg-white/5 transition-colors'
            )}
          >
            {/* Rank */}
            <div className="text-sm font-bold text-muted">
              {i < 3 ? RANK_MEDALS[i] : <span className="font-mono text-xs">{i + 1}</span>}
            </div>

            {/* Domain */}
            <div className="flex items-center gap-2 min-w-0">
              <div>
                <a
                  href={`https://${entry.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-text-primary hover:text-accent-light flex items-center gap-1"
                >
                  {entry.domain}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
                <p className="text-xs text-muted">
                  {getScoreLabel(entry.latest_evil_score)}
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center gap-2">
              <ScoreBadge score={entry.latest_evil_score} />
              <TrendIndicator latest={entry.latest_evil_score} worst={entry.worst_score} best={entry.best_score} />
            </div>

            {/* Worst/Best range */}
            <div className="text-center">
              <span className="text-danger text-xs font-mono">{entry.worst_score}</span>
              <span className="text-muted text-xs"> / </span>
              <span className="text-success text-xs font-mono">{entry.best_score}</span>
            </div>

            {/* Scan count */}
            <div className="text-center text-xs text-muted font-mono">
              {entry.scan_count.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-muted mt-4">
        Scan any website to add it to the leaderboard.{' '}
        <a href="/" className="text-accent-light hover:underline">Run a scan →</a>
      </p>
    </div>
  );
}
