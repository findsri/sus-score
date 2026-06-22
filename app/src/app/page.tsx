'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, FileCode, Loader2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { runScan, ScanResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ScanResults } from './ScanResults';

type InputMode = 'url' | 'html';

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('url');
  const [urlInput, setUrlInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState('');

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    const payload = mode === 'url'
      ? { url: urlInput.trim(), takeScreenshot: false }
      : { html: htmlInput.trim() };

    if (mode === 'url' && !urlInput.trim()) {
      setError('Please enter a URL to scan');
      return;
    }
    if (mode === 'html' && !htmlInput.trim()) {
      setError('Please paste some HTML to analyze');
      return;
    }

    setLoading(true);
    try {
      const data = await runScan(payload);
      setResult(data);
      toast.success(`Scan complete — Evil Score: ${data.evilScore}/100`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-12 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-danger/5 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-full px-3 py-1 text-xs text-danger mb-6">
            <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
            Expose manipulative UX patterns
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            The <span className="gradient-text">Dark Pattern</span> Detector
          </h1>
          <p className="text-text-secondary text-lg mb-8 max-w-2xl mx-auto">
            Scan any website or paste HTML to detect hidden unsubscribe buttons,
            confirm-shaming, and other deceptive UX patterns. Get an Evil Score and a fix.
          </p>

          {/* Scanner card */}
          <div className="glass rounded-2xl p-6 text-left max-w-2xl mx-auto">
            {/* Mode tabs */}
            <div className="flex gap-1 bg-background rounded-lg p-1 mb-4 w-fit">
              {[
                { id: 'url', label: 'URL', icon: Link2 },
                { id: 'html', label: 'Paste HTML', icon: FileCode },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id as InputMode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    mode === id ? 'bg-accent text-white' : 'text-muted hover:text-text-primary'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleScan} className="space-y-3">
              {mode === 'url' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                    disabled={loading}
                    aria-label="Website URL to scan"
                  />
                </div>
              ) : (
                <textarea
                  value={htmlInput}
                  onChange={e => setHtmlInput(e.target.value)}
                  placeholder="Paste HTML here…"
                  rows={8}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors font-mono resize-none"
                  disabled={loading}
                  aria-label="HTML content to analyze"
                />
              )}

              {error && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                  loading
                    ? 'bg-accent/50 text-white/50 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent/80 hover:shadow-lg hover:shadow-accent/20'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning for dark patterns…
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Detect Dark Patterns
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick scan examples */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs text-muted">
            <span>Try:</span>
            {['https://amazon.com', 'https://linkedin.com', 'https://reddit.com'].map(url => (
              <button
                key={url}
                onClick={() => { setMode('url'); setUrlInput(url); }}
                className="text-accent-light hover:underline"
              >
                {url.replace('https://', '')}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 pb-16"
          >
            <ScanResults result={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature grid */}
      {!result && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-center text-xl font-bold mb-8 text-text-secondary">What we detect</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '🎨', title: 'Low Contrast', desc: 'Invisible unsubscribe links via color manipulation' },
              { emoji: '🔍', title: 'Tiny Fonts', desc: 'Sub-10px opt-out text designed to be missed' },
              { emoji: '👻', title: 'Hidden Elements', desc: 'display:none and off-screen opt-out buttons' },
              { emoji: '😢', title: 'Confirm Shaming', desc: '"No thanks, I enjoy losing money" patterns' },
              { emoji: '🏴', title: 'Misleading Labels', desc: 'Vague CTA text instead of clear "Unsubscribe"' },
              { emoji: '🔒', title: 'Pre-ticked Boxes', desc: 'Opt-in checkboxes checked by default' },
              { emoji: '⏱️', title: 'False Urgency', desc: 'Fake countdown timers and scarcity claims' },
              { emoji: '⚓', title: 'Footer Burial', desc: 'Critical controls hidden deep in footers' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="glass rounded-xl p-4">
                <div className="text-2xl mb-2">{emoji}</div>
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
