'use client';
import { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';

interface DiffEntry {
  original: string;
  fixed: string;
  description: string;
}

interface DiffViewerProps {
  diff: DiffEntry[];
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (diff.length === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        No automatic fixes available for the detected patterns.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {diff.length} fix{diff.length !== 1 ? 'es' : ''} available — showing what changed
      </p>

      {diff.map((entry, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
          <button
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-3.5 h-3.5 text-success" />
            </div>
            <p className="text-sm text-text-secondary flex-1 leading-snug">{entry.description}</p>
            <span className="text-muted flex-shrink-0">
              {expandedIndex === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {expandedIndex === i && (
            <div className="border-t border-border">
              <div className="grid grid-cols-2">
                {/* Original */}
                <div className="border-r border-border">
                  <div className="px-3 py-2 bg-danger/10 border-b border-border">
                    <span className="text-xs text-danger font-semibold">— Original</span>
                  </div>
                  <pre className="p-3 text-xs text-danger/80 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {entry.original.slice(0, 400)}
                  </pre>
                </div>
                {/* Fixed */}
                <div>
                  <div className="px-3 py-2 bg-success/10 border-b border-border">
                    <span className="text-xs text-success font-semibold">+ Fixed</span>
                  </div>
                  <pre className="p-3 text-xs text-success/80 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {entry.fixed.slice(0, 400)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
