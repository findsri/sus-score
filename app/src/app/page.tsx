'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, FileCode, Loader2, AlertCircle, Shield, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { runScan, ScanResponse } from '@/lib/api';
import { getDemoScan, DEMO_SCANS } from '@/lib/demoData';
import { cn } from '@/lib/utils';
import { ScanResults } from './ScanResults';

type InputMode = 'url' | 'html';

const DEMO_SITES = [
  { url: 'https://amazon.com', score: 82, label: '🔴 82 — Very Evil' },
  { url: 'https://linkedin.com', score: 74, label: '🟠 74 — Manipulative' },
  { url: 'https://github.com', score: 8, label: '🟢 8 — Mostly Clean' },
];

export default function HomePage() {
  const [mode, setMode] = useState<InputMode>('url');
  const [urlInput, setUrlInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState('');
  const [isDemoResult, setIsDemoResult] = useState(false);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsDemoResult(false);

    if (mode === 'url' && !urlInput.trim()) { setError('Please enter a URL to scan'); return; }
    if (mode === 'html' && !htmlInput.trim()) { setError('Please paste some HTML to analyze'); return; }

    setLoading(true);

    // Try demo data first for known URLs (instant, no API needed)
    if (mode === 'url') {
      const demo = getDemoScan(urlInput.trim());
      if (demo) {
        await new Promise(r => setTimeout(r, 1200)); // realistic loading feel
        setResult(demo);
        setIsDemoResult(true);
        setLoading(false);
        toast.success(`Scan complete — Evil Score: ${demo.evilScore}/100`);
        return;
      }
    }

    // Otherwise call the real API
    try {
      const payload = mode === 'url'
        ? { url: urlInput.trim(), takeScreenshot: false }
        : { html: htmlInput.trim() };
      const data = await runScan(payload);
      setResult(data);
      toast.success(`Scan complete — Evil Score: ${data.evilScore}/100`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed. Please try again.';
      setError(msg);
      toast.error('API unavailable — try one of the demo sites below for an instant preview.');
    } finally {
      setLoading(false);
    }
  }

  function loadDemo(url: string) {
    setMode('url');
    setUrlInput(url);
    setError('');
    setResult(null);
    setIsDemoResult(false);
    const demo = getDemoScan(url);
    if (demo) {
      setLoading(true);
      setTimeout(() => {
        setResult(demo);
        setIsDemoResult(true);
        setLoading(false);
        toast.success(`Scan complete — Evil Score: ${demo.evilScore}/100`);
      }, 1000);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 pt-16 pb-12 text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[200px] bg-danger/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 w-[250px] h-[150px] bg-warning/5 rounded-full blur-[60px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-danger/10 border border-danger/25 rounded-full px-4 py-1.5 text-xs font-medium text-danger mb-6"
          >
            <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
            They hide it. We find it.
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight">
            The <span className="gradient-text">Dark Pattern</span><br />Detector
          </h1>

          <p className="text-text-secondary text-lg mb-3 max-w-xl mx-auto leading-relaxed">
            Paste any URL. Get an <strong className="text-text-primary">Evil Score</strong>, a full breakdown of manipulative UX patterns, and the exact HTML fixes needed.
          </p>

          <p className="text-sm text-muted mb-10 max-w-md mx-auto">
            Hidden unsubscribe buttons · Confirm-shaming · Pre-ticked checkboxes · Fake urgency · And more.
          </p>

          {/* Scanner card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 text-left max-w-2xl mx-auto shadow-2xl"
          >
            {/* Mode tabs */}
            <div className="flex gap-1 bg-background rounded-lg p-1 mb-4 w-fit">
              {[
                { id: 'url', label: 'Scan URL', icon: Link2 },
                { id: 'html', label: 'Paste HTML', icon: FileCode },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id as InputMode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
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
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3.5 text-sm placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                    disabled={loading}
                    aria-label="Website URL to scan"
                  />
                </div>
              ) : (
                <textarea
                  value={htmlInput}
                  onChange={e => setHtmlInput(e.target.value)}
                  placeholder="Paste HTML here — works for websites and email newsletters…"
                  rows={7}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent font-mono resize-none transition-all"
                  disabled={loading}
                  aria-label="HTML content to analyze"
                />
              )}

              {error && (
                <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all',
                  loading
                    ? 'bg-accent/50 text-white/50 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accent/85 hover:shadow-xl hover:shadow-accent/25 active:scale-[0.99]'
                )}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scanning for dark patterns…</>
                ) : (
                  <><Shield className="w-4 h-4" /> Detect Dark Patterns</>
                )}
              </button>
            </form>
          </motion.div>

          {/* Demo shortcuts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 space-y-2"
          >
            <p className="text-xs text-muted">Try a live demo — instant results, no setup needed:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_SITES.map(({ url, label }) => (
                <button
                  key={url}
                  onClick={() => loadDemo(url)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-xs font-medium text-text-secondary hover:border-accent/40 hover:text-text-primary transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-accent-light" />
                  {url.replace('https://', '')}
                  <span className="text-muted">{label.split('—')[0].trim()}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.scanId}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto px-4 pb-16"
          >
            {isDemoResult && (
              <div className="flex items-center gap-2 mb-4 text-xs text-muted bg-surface border border-border rounded-lg px-3 py-2 w-fit mx-auto">
                <Star className="w-3.5 h-3.5 text-warning" />
                Demo result — start the API server for live scanning of any URL
              </div>
            )}
            <ScanResults result={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature grid — only shown before first scan */}
      {!result && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-5xl mx-auto px-4 pb-20"
        >
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted mb-8">
            What we detect
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '🎨', title: 'Low Contrast', desc: 'Invisible opt-out links via deliberate color manipulation' },
              { emoji: '🔍', title: 'Tiny Fonts', desc: 'Sub-10px opt-out text — designed to be missed' },
              { emoji: '👻', title: 'Hidden Elements', desc: 'display:none and off-screen cancel buttons' },
              { emoji: '😢', title: 'Confirm Shaming', desc: '"No thanks, I enjoy losing money" patterns' },
              { emoji: '🏷️', title: 'Misleading Labels', desc: 'Vague "click here" instead of clear "Unsubscribe"' },
              { emoji: '🔒', title: 'Pre-ticked Boxes', desc: 'Opt-in checkboxes checked by default (illegal in EU)' },
              { emoji: '⏱️', title: 'False Urgency', desc: 'Fake countdown timers and "only X left" scarcity' },
              { emoji: '⚓', title: 'Footer Burial', desc: 'Critical controls hidden 4 scrolls deep in footers' },
            ].map(({ emoji, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                className="glass rounded-xl p-4 hover:border-accent/30 transition-colors"
              >
                <div className="text-2xl mb-2">{emoji}</div>
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Social proof / stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
            {[
              { value: '8', label: 'detection rules' },
              { value: '10+', label: 'sites in Hall of Shame' },
              { value: '0–100', label: 'Evil Score range' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-extrabold gradient-text">{value}</div>
                <div className="text-xs text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
