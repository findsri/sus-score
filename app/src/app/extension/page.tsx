import { Puzzle, Download, Chrome, Shield, Zap, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ExtensionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-success/10 border border-success/20 rounded-full px-3 py-1 text-xs text-success mb-4">
          <Puzzle className="w-3.5 h-3.5" />
          Browser Extension
        </div>
        <h1 className="text-3xl font-extrabold mb-3">
          Dark Pattern Detector <span className="gradient-text">Extension</span>
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Get real-time Evil Score badges on every website you visit.
          No need to copy URLs — it just works in the background.
        </p>
      </div>

      {/* Install card */}
      <div className="glass rounded-2xl p-8 text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/20 flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-accent-light" />
        </div>
        <h2 className="text-xl font-bold mb-2">Install the Extension</h2>
        <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
          Load the extension manually in developer mode. Chrome Web Store submission coming soon.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/extension.zip"
            download
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/80 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Extension (.zip)
          </a>
          <a
            href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface border border-border text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <Chrome className="w-4 h-4" />
            How to load in Chrome
          </a>
        </div>
      </div>

      {/* Installation steps */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="font-bold mb-4">Manual Installation Steps</h3>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Download the extension', desc: 'Click "Download Extension" above and unzip the file.' },
            { step: '2', title: 'Open Chrome Extensions', desc: 'Navigate to chrome://extensions in your browser.' },
            { step: '3', title: 'Enable Developer Mode', desc: 'Toggle the "Developer mode" switch in the top right corner.' },
            { step: '4', title: 'Load Unpacked', desc: 'Click "Load unpacked" and select the unzipped extension folder.' },
            { step: '5', title: 'Start browsing', desc: 'The Dark Pattern Detector badge will appear on every website you visit.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 items-start">
              <div className="w-7 h-7 rounded-full bg-accent/20 text-accent-light text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Real-time scanning', desc: 'Scans every page as you browse, instantly.' },
          { icon: Eye, title: 'Evil Score badge', desc: 'Colored badge shows the score at a glance.' },
          { icon: Shield, title: 'Pattern details', desc: 'Click the badge to see the full pattern report.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass rounded-xl p-4 text-center">
            <Icon className="w-6 h-6 text-accent-light mx-auto mb-2" />
            <h4 className="text-sm font-semibold mb-1">{title}</h4>
            <p className="text-xs text-muted">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
