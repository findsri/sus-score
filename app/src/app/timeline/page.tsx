'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Clock, Search } from 'lucide-react';
import { getTimeline, TimelineEntry } from '@/lib/api';
import { getScoreColor } from '@/lib/utils';

// Demo data for pre-seeded domains
const DEMO_TIMELINES: Record<string, TimelineEntry[]> = {
  'amazon.com': [
    { evil_score: 70, total_patterns: 8, scanned_at: '2024-01-15T00:00:00Z' },
    { evil_score: 74, total_patterns: 9, scanned_at: '2024-02-15T00:00:00Z' },
    { evil_score: 78, total_patterns: 10, scanned_at: '2024-03-15T00:00:00Z' },
    { evil_score: 79, total_patterns: 10, scanned_at: '2024-04-15T00:00:00Z' },
    { evil_score: 82, total_patterns: 11, scanned_at: '2024-05-15T00:00:00Z' },
    { evil_score: 82, total_patterns: 11, scanned_at: '2024-06-15T00:00:00Z' },
  ],
  'linkedin.com': [
    { evil_score: 60, total_patterns: 6, scanned_at: '2024-01-15T00:00:00Z' },
    { evil_score: 65, total_patterns: 7, scanned_at: '2024-02-15T00:00:00Z' },
    { evil_score: 68, total_patterns: 7, scanned_at: '2024-03-15T00:00:00Z' },
    { evil_score: 72, total_patterns: 8, scanned_at: '2024-04-15T00:00:00Z' },
    { evil_score: 74, total_patterns: 9, scanned_at: '2024-05-15T00:00:00Z' },
    { evil_score: 74, total_patterns: 9, scanned_at: '2024-06-15T00:00:00Z' },
  ],
  'github.com': [
    { evil_score: 12, total_patterns: 1, scanned_at: '2024-01-15T00:00:00Z' },
    { evil_score: 10, total_patterns: 1, scanned_at: '2024-02-15T00:00:00Z' },
    { evil_score: 9, total_patterns: 1, scanned_at: '2024-03-15T00:00:00Z' },
    { evil_score: 8, total_patterns: 1, scanned_at: '2024-04-15T00:00:00Z' },
    { evil_score: 7, total_patterns: 0, scanned_at: '2024-05-15T00:00:00Z' },
    { evil_score: 8, total_patterns: 1, scanned_at: '2024-06-15T00:00:00Z' },
  ],
};

interface ChartPoint { date: string; score: number; patterns: number; }

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{payload: ChartPoint}> }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="glass rounded-xl p-3 border border-border text-xs space-y-1">
        <p className="text-text-secondary">{d.date}</p>
        <p className="font-semibold" style={{ color: getScoreColor(d.score) }}>
          Evil Score: {d.score}/100
        </p>
        <p className="text-muted">Patterns: {d.patterns}</p>
      </div>
    );
  }
  return null;
};

export default function TimelinePage() {
  const [domain, setDomain] = useState('amazon.com');
  const [inputDomain, setInputDomain] = useState('amazon.com');
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimeline('amazon.com');
  }, []);

  async function loadTimeline(d: string) {
    setLoading(true);
    try {
      const data = await getTimeline(d);
      if (data.length > 0) {
        setTimeline(data);
      } else {
        // Fall back to demo data
        setTimeline(DEMO_TIMELINES[d] ?? []);
      }
    } catch {
      setTimeline(DEMO_TIMELINES[d] ?? []);
    } finally {
      setLoading(false);
      setDomain(d);
    }
  }

  const chartData: ChartPoint[] = timeline.map(t => ({
    date: new Date(t.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: t.evil_score,
    patterns: t.total_patterns,
  }));

  const latestScore = chartData[chartData.length - 1]?.score ?? 0;
  const firstScore = chartData[0]?.score ?? 0;
  const trend = latestScore - firstScore;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-xs text-accent-light mb-4">
          <Clock className="w-3.5 h-3.5" />
          Evil Score Timeline
        </div>
        <h1 className="text-3xl font-extrabold mb-3">Track <span className="gradient-text">Dark Pattern Changes</span> Over Time</h1>
        <p className="text-text-secondary">See if websites are getting better or worse. Catch companies slowly adding dark patterns.</p>
      </motion.div>

      {/* Domain search */}
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={inputDomain}
              onChange={e => setInputDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadTimeline(inputDomain.trim())}
              placeholder="enter domain (e.g. amazon.com)"
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:border-accent"
              aria-label="Domain to view timeline for"
            />
          </div>
          <button
            onClick={() => loadTimeline(inputDomain.trim())}
            className="px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors"
          >
            View Timeline
          </button>
        </div>

        {/* Quick picks */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {Object.keys(DEMO_TIMELINES).map(d => (
            <button
              key={d}
              onClick={() => { setInputDomain(d); loadTimeline(d); }}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${domain === d ? 'bg-accent/20 border-accent/30 text-accent-light' : 'border-border text-muted hover:border-accent/30'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {timeline.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg">{domain}</h2>
              <p className="text-xs text-muted">{timeline.length} scans tracked</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: getScoreColor(latestScore) }}>
                {latestScore}
              </div>
              <div className={`text-xs font-medium ${trend > 0 ? 'text-danger' : trend < 0 ? 'text-success' : 'text-muted'}`}>
                {trend > 0 ? `↑ +${trend} worse` : trend < 0 ? `↓ ${trend} better` : '→ stable'}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Very Evil', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Shady', fill: '#f59e0b', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
