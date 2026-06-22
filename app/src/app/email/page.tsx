'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { runScan, ScanResponse } from '@/lib/api';
import { ScanResults } from '../ScanResults';
import { cn } from '@/lib/utils';

const SAMPLE_EMAIL_HTML = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your weekly digest is here!</h2>
  <p>Check out this week's top deals just for you.</p>
  <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
    Shop Now
  </a>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    <p style="font-size: 8px; color: #cccccc;">
      <a href="#" style="color: #dddddd; text-decoration: none;">
        To stop receiving our emails, click here
      </a>
      &nbsp;|&nbsp; 
      <label><input type="checkbox" checked name="promotions"> Keep me subscribed to all partner promotions</label>
    </p>
    <p style="font-size: 7px; color: #eeeeee;">No thanks, I already know everything I need to know and don't want to save money.</p>
  </div>
</div>
`;

export default function EmailScannerPage() {
  const [htmlInput, setHtmlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState('');

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!htmlInput.trim()) {
      setError('Please paste some email HTML to analyze');
      return;
    }

    setLoading(true);
    try {
      const data = await runScan({ html: htmlInput.trim(), isEmail: true });
      setResult(data);
      toast.success(`Email scan complete — Evil Score: ${data.evilScore}/100`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 text-xs text-accent-light mb-4">
          <Mail className="w-3.5 h-3.5" />
          Email Newsletter Scanner
        </div>
        <h1 className="text-3xl font-extrabold mb-3">
          <span className="gradient-text">Email Dark Pattern</span> Detector
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Paste raw HTML from any marketing email to detect dark patterns inside the email body.
          The first tool that does this for emails, not just websites.
        </p>
      </motion.div>

      <div className="glass rounded-2xl p-6 mb-8">
        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Paste email HTML source
              </label>
              <button
                type="button"
                onClick={() => setHtmlInput(SAMPLE_EMAIL_HTML)}
                className="text-xs text-accent-light hover:underline"
              >
                Load sample dark-pattern email
              </button>
            </div>
            <textarea
              value={htmlInput}
              onChange={e => setHtmlInput(e.target.value)}
              placeholder={`Paste the raw HTML from an email newsletter here…\n\nTip: In Gmail, open the email → three dots → Show original → copy the HTML`}
              rows={12}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm placeholder:text-muted focus:outline-none focus:border-accent font-mono resize-none"
              disabled={loading}
              aria-label="Email HTML to analyze"
            />
          </div>

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
                : 'bg-accent text-white hover:bg-accent/80'
            )}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning email…</>
            ) : (
              <><Shield className="w-4 h-4" /> Scan Email for Dark Patterns</>
            )}
          </button>
        </form>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { emoji: '🔍', title: 'How to get email HTML', desc: 'Gmail: Open email → ⋮ → Show original. Outlook: File → Properties → Internet headers.' },
            { emoji: '🎯', title: 'What we detect', desc: 'Tiny unsubscribe text, confirm-shaming, pre-ticked checkboxes, and hidden opt-out links.' },
            { emoji: '🔒', title: 'Privacy first', desc: 'HTML is analyzed locally and not stored unless you choose to save the scan.' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="bg-background rounded-xl p-3">
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-xs font-semibold mb-1">{title}</div>
              <div className="text-xs text-muted leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <ScanResults result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
