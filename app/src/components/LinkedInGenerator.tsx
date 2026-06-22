'use client';
import { useState } from 'react';
import { Linkedin, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LinkedInGeneratorProps {
  post: string;
}

export function LinkedInGenerator({ post }: LinkedInGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    toast.success('Copied to clipboard! Ready to paste on LinkedIn.');
    setTimeout(() => setCopied(false), 2000);
  }

  const preview = post.slice(0, 180) + (post.length > 180 ? '…' : '');

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-accent/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center">
            <Linkedin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">LinkedIn Post Generator</p>
            <p className="text-xs text-muted">Ready-to-post content about your scan</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            copied
              ? 'bg-success/20 text-success'
              : 'bg-[#0A66C2]/20 text-[#5aafed] hover:bg-[#0A66C2]/30'
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Post'}
        </button>
      </div>

      {/* Post preview */}
      <div className="p-4">
        <div className="bg-background rounded-lg p-4 border border-border">
          <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
            {expanded ? post : preview}
          </pre>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-text-secondary transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Show less' : 'Show full post'}
        </button>
      </div>

      {/* Post to LinkedIn button */}
      <div className="px-4 pb-4">
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://darkpatterndetector.app')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0A66C2] text-white text-sm font-medium hover:bg-[#004182] transition-colors"
        >
          <Linkedin className="w-4 h-4" />
          Share on LinkedIn
        </a>
        <p className="text-xs text-muted text-center mt-2">
          Copy the post first, then paste it when LinkedIn opens
        </p>
      </div>
    </div>
  );
}
