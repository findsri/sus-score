'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenshotComparisonProps {
  originalBase64: string;
  cleanBase64?: string;
}

export function ScreenshotComparison({ originalBase64, cleanBase64 }: ScreenshotComparisonProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'clean' | 'side-by-side'>('side-by-side');

  const originalSrc = `data:image/jpeg;base64,${originalBase64}`;
  const cleanSrc = cleanBase64 ? `data:image/jpeg;base64,${cleanBase64}` : null;

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-background rounded-lg p-1 w-fit">
        {[
          { id: 'original', label: 'Original', icon: Eye },
          ...(cleanSrc ? [{ id: 'clean', label: 'Cleaned', icon: Sparkles }] : []),
          ...(cleanSrc ? [{ id: 'side-by-side', label: 'Side by Side', icon: Eye }] : []),
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              activeTab === id
                ? 'bg-accent text-white'
                : 'text-muted hover:text-text-primary'
            )}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Screenshot display */}
      {activeTab === 'side-by-side' && cleanSrc ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Original (with dark patterns)
            </p>
            <div className="rounded-xl overflow-hidden border border-danger/30">
              <img src={originalSrc} alt="Original website screenshot" className="w-full" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-success" />
              <span className="text-success">Cleaned version (fixed)</span>
            </p>
            <div className="rounded-xl overflow-hidden border border-success/30">
              <img src={cleanSrc} alt="Cleaned website screenshot" className="w-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-border">
          <img
            src={activeTab === 'clean' && cleanSrc ? cleanSrc : originalSrc}
            alt={activeTab === 'clean' ? 'Cleaned screenshot' : 'Original screenshot'}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
