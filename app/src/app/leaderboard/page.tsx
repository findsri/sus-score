'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api';
import { getScoreColor, getScoreLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

const SEED_DATA: LeaderboardEntry[] = [
  { domain: 'amazon.com',      latest_evil_score: 82, worst_score: 87, best_score: 75, scan_count: 142, last_scanned_at: new Date().toISOString() },
  { domain: 'linkedin.com',    latest_evil_score: 74, worst_score: 78, best_score: 65, scan_count: 98,  last_scanned_at: new Date().toISOString() },
  { domain: 'booking.com',     latest_evil_score: 71, worst_score: 76, best_score: 60, scan_count: 67,  last_scanned_at: new Date().toISOString() },
  { domain: 'ticketmaster.com',latest_evil_score: 68, worst_score: 72, best_score: 55, scan_count: 45,  last_scanned_at: new Date().toISOString() },
  { domain: 'tripadvisor.com', latest_evil_score: 64, worst_score: 68, best_score: 50, scan_count: 39,  last_scanned_at: new Date().toISOString() },
  { domain: 'hotels.com',      latest_evil_score: 61, worst_score: 65, best_score: 48, scan_count: 31,  last_scanned_at: new Date().toISOString() },
  { domain: 'quora.com',       latest_evil_score: 55, worst_score: 60, best_score: 45, scan_count: 28,  last_scanned_at: new Date().toISOString() },
  { domain: 'forbes.com',      latest_evil_score: 49, worst_score: 55, best_score: 40, scan_count: 22,  last_scanned_at: new Date().toISOString() },
  { domain: 'reddit.com',      latest_evil_score: 23, worst_score: 28, best_score: 18, scan_count: 88,  last_scanned_at: new Date().toISOString() },
  { domain: 'github.com',      latest_evil_score: 8,  worst_score: 12, best_score: 5,  scan_count: 120, last_scanned_at: new Date().toISOString() },
];

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function EvilBar({ score }: { score: number }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="font-bold text-sm tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function TrendIcon({ latest, worst, best }: { latest: number; worst: number; best: number }) {
  const mid = (worst + best) / 2;
  if (latest > mid + 3) return <TrendingUp className="w-3.5 h-3.5 text-danger" title="Getting worse" />;
  if (latest < mid - 3) return <TrendingDown className="w-3.5 h-3.5 text-success" title="Improving" />;
  return <Minus className="w-3.5 h-3.5 text-muted" title="Stable" />;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(SEED_DATA);
  const [usingLiveData, setUsingLiveData] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(data => { if (data.length > 0) { setEntries(data); setUsingLiveData(true); } })
      .catch(() => {});
  }, []);

  const topScore = entries[0]?.latest_evil_score ?? 0;
  const avgScore = Math.round(entries.reduce((s, e) => s + e.latest_evil_score, 0) / entries.length);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-warning/10 border border-warning/20 rounded-full px-4 py-1.5 text-xs font-medium text-warning mb-4">
          <Trophy className="w-3.5 h-3.5" />
          Community Hall of Shame
        </div>
        <h1 className="text-4xl font-extrabold mb-3">
          Most <span className="gradient-text">Manipulative</span> Websites
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto text-sm">
          Ranked by Evil Score. Every site scan updates this leaderboard in real time.
          {!usingLiveData && (
            <span className="text-muted block mt-1 text-xs">Showing demo data — connect a database for live community rankings</span>
          )}
        </p>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Sites tracked', value: entries.length, hex: '' },
          { label: 'Highest evil score', value: topScore, hex: getScoreColor(topScore) },
          { label: 'Average score', value: avgScore, hex: getScoreColor(avgScore) },
        ].map(({ label, value, hex }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <div
              className="text-3xl font-extrabold"
              style={{ color: hex || '#f8fafc' }}
            >
              {value}
            </div>
            <div className="text-xs text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[44px_1fr_140px_110px_72px] gap-0 px-5 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted">
          <div>#</div>
          <div>Website</div>
          <div>Evil Score</div>
          <div className="text-center">Peak / Best</div>
          <div className="text-right">Scans</div>
        </div>

        {entries.map((entry, i) => {
          const color = getScoreColor(entry.latest_evil_score);
          return (
            <motion.div
              key={entry.domain}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-[44px_1fr_140px_110px_72px] gap-0 items-center px-5 py-4 border-b border-border last:border-0 hover:bg-white/[0.03] transition-colors group"
            >
              {/* Rank */}
              <div className="text-sm font-bold">
                {i < 3
                  ? <span className="text-base">{RANK_MEDALS[i]}</span>
                  : <span className="text-muted font-mono text-xs">{i + 1}</span>
                }
              </div>

              {/* Domain */}
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://${entry.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-text-primary group-hover:text-accent-light transition-colors flex items-center gap-1"
                  >
                    {entry.domain}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </a>
                  <TrendIcon latest={entry.latest_evil_score} worst={entry.worst_score} best={entry.best_score} />
                </div>
                <p className="text-xs mt-0.5" style={{ color }}>{getScoreLabel(entry.latest_evil_score)}</p>
              </div>

              {/* Score bar */}
              <div>
                <EvilBar score={entry.latest_evil_score} />
              </div>

              {/* Range */}
              <div className="text-center">
                <span className="text-danger text-xs font-mono font-semibold">{entry.worst_score}</span>
                <span className="text-muted text-xs mx-1">/</span>
                <span className="text-success text-xs font-mono font-semibold">{entry.best_score}</span>
              </div>

              {/* Scan count */}
              <div className="text-right text-xs text-muted font-mono">
                {entry.scan_count.toLocaleString()}
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted mt-6">
        Scan any website to add it here.{' '}
        <a href="/" className="text-accent-light hover:underline font-medium">Run a scan →</a>
      </p>
    </div>
  );
}
