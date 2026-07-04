'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, Code, Wrench } from 'lucide-react';
import { DetectedPattern } from '@sus-score/detector';
import { getSeverityColor, getCategoryLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PatternCardProps {
  pattern: DetectedPattern;
  index: number;
}

const SEVERITY_ICONS: Record<string, string> = {
  critical: '🚨',
  high: '⚠️',
  medium: '🟡',
  low: '💡',
};

export function PatternCard({ pattern, index }: PatternCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = getSeverityColor(pattern.severity);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
      >
        <span className="text-xl mt-0.5 flex-shrink-0">{SEVERITY_ICONS[pattern.severity]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {pattern.severity.toUpperCase()}
            </span>
            <span className="text-xs text-muted bg-border px-2 py-0.5 rounded-full">
              {getCategoryLabel(pattern.category)}
            </span>
          </div>
          <p className="text-sm text-text-primary leading-snug">{pattern.description}</p>
        </div>

        <div className="flex-shrink-0 text-muted mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Element snippet */}
              {pattern.element && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted">
                    <Code className="w-3.5 h-3.5" />
                    <span>Offending element</span>
                  </div>
                  <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto text-text-secondary font-mono border border-border leading-relaxed whitespace-pre-wrap">
                    {pattern.element.slice(0, 250)}
                    {pattern.element.length > 250 ? '…' : ''}
                  </pre>
                </div>
              )}

              {/* Fix suggestion */}
              <div className={cn(
                'flex items-start gap-2 p-3 rounded-lg',
                'bg-success/10 border border-success/20'
              )}>
                <Wrench className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-success leading-relaxed">{pattern.fixSuggestion}</p>
              </div>

              {/* Details */}
              {Object.keys(pattern.details).length > 0 && (
                <div className="text-xs text-muted space-y-1">
                  {Object.entries(pattern.details).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-text-secondary font-mono">{k}:</span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
