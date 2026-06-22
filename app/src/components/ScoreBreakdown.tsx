'use client';
import { motion } from 'framer-motion';
import { getCategoryLabel, getScoreColor } from '@/lib/utils';

interface ScoreBreakdownProps {
  breakdown: Record<string, number>;
}

const CATEGORY_MAX: Record<string, number> = {
  low_contrast: 25,
  tiny_font: 15,
  hidden_element: 20,
  no_styling: 10,
  off_screen: 20,
  misleading_label: 15,
  confirm_shaming: 20,
  buried_in_footer: 10,
  opacity_hidden: 20,
};

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const entries = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        No patterns detected in any category 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([category, score], i) => {
        const max = CATEGORY_MAX[category] ?? 25;
        const pct = Math.min((score / max) * 100, 100);
        const color = getScoreColor(pct);

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">{getCategoryLabel(category)}</span>
              <span style={{ color }} className="font-mono font-semibold">
                {score}/{max}
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.08 + 0.2, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
