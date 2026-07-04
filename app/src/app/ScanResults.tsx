'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart2, Eye, Wrench, Linkedin, ExternalLink } from 'lucide-react';
import { ScanResponse } from '@/lib/api';
import { SusScoreGauge } from '@/components/SusScoreGauge';
import { PatternCard } from '@/components/PatternCard';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';
import { ScreenshotComparison } from '@/components/ScreenshotComparison';
import { LinkedInGenerator } from '@/components/LinkedInGenerator';
import { DiffViewer } from '@/components/DiffViewer';
import { cn } from '@/lib/utils';

interface ScanResultsProps {
  result: ScanResponse;
}

type Tab = 'patterns' | 'breakdown' | 'screenshots' | 'fix' | 'linkedin';

export function ScanResults({ result }: ScanResultsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('patterns');

  const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{className?: string}>; count?: number }> = [
    { id: 'patterns', label: 'Patterns', icon: Shield, count: result.totalPatterns },
    { id: 'breakdown', label: 'Breakdown', icon: BarChart2 },
    ...(result.screenshotBase64 ? [{ id: 'screenshots' as Tab, label: 'Screenshots', icon: Eye }] : []),
    ...(result.diff && result.diff.length > 0 ? [{ id: 'fix' as Tab, label: 'Fix It', icon: Wrench, count: result.diff.length }] : []),
    ...(result.linkedInPost ? [{ id: 'linkedin' as Tab, label: 'LinkedIn', icon: Linkedin }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Score overview */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <SusScoreGauge score={result.susScore} size={220} />

          <div className="flex-1 space-y-4">
            {result.url && (
              <div className="flex items-center gap-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-light text-sm hover:underline flex items-center gap-1"
                >
                  {result.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sus Score', value: `${result.susScore}/100`, color: result.susScore >= 70 ? 'text-danger' : result.susScore >= 40 ? 'text-warning' : 'text-success' },
                { label: 'Patterns Found', value: result.totalPatterns, color: 'text-text-primary' },
                { label: 'Scanned', value: new Date(result.scannedAt).toLocaleDateString(), color: 'text-muted' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-background rounded-xl p-3 text-center">
                  <div className={cn('text-2xl font-bold', color)}>{value}</div>
                  <div className="text-xs text-muted mt-1">{label}</div>
                </div>
              ))}
            </div>

            <p className="text-sm text-text-secondary">
              {result.totalPatterns === 0
                ? '✅ No dark patterns detected — this site looks clean!'
                : `Found ${result.totalPatterns} dark pattern${result.totalPatterns !== 1 ? 's' : ''} across ${Object.values(result.scoreBreakdown).filter(v => v > 0).length} categories.`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
                activeTab === id
                  ? 'border-accent text-accent-light'
                  : 'border-transparent text-muted hover:text-text-primary'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="bg-accent/20 text-accent-light text-xs px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'patterns' && (
            <div className="space-y-3">
              {result.patterns.length === 0 ? (
                <div className="text-center py-10 text-muted">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-semibold text-text-primary">No dark patterns detected</p>
                  <p className="text-sm mt-1">This website appears to follow ethical UX practices.</p>
                </div>
              ) : (
                result.patterns.map((pattern, i) => (
                  <PatternCard key={pattern.id} pattern={pattern} index={i} />
                ))
              )}
            </div>
          )}

          {activeTab === 'breakdown' && (
            <ScoreBreakdown breakdown={result.scoreBreakdown} />
          )}

          {activeTab === 'screenshots' && result.screenshotBase64 && (
            <ScreenshotComparison
              originalBase64={result.screenshotBase64}
              cleanBase64={result.cleanScreenshotBase64}
            />
          )}

          {activeTab === 'fix' && result.diff && (
            <DiffViewer diff={result.diff} />
          )}

          {activeTab === 'linkedin' && result.linkedInPost && (
            <LinkedInGenerator post={result.linkedInPost} />
          )}
        </div>
      </div>
    </div>
  );
}
