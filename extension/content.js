/**
 * Sus Score — Content Script
 *
 * Runs inside the real browser page, so it has access to:
 *  - The full rendered DOM (no WAF, no bot detection)
 *  - Computed CSS styles (not just inline styles)
 *  - JavaScript-rendered content
 *
 * Strategy: before sending HTML to the API, we ANNOTATE each element
 * with its computed styles as data attributes so the server-side
 * Cheerio detector can see them.
 */

(function () {
  if (window.__dpdInjected) return;
  window.__dpdInjected = true;

  const API_URL = 'http://localhost:3000/api/scan';
  const SKIP_SCHEMES = ['chrome://', 'chrome-extension://', 'about:', 'file://'];
  if (SKIP_SCHEMES.some(s => location.href.startsWith(s))) return;

  // ── Keywords that indicate opt-out elements ────────────────────────────────
  const UNSUB_TEXT_RE = /unsubscribe|opt[\s-]?out|cancel\s+subscri|stop\s+(receiving|emails)|manage\s+(preference|subscri|notif)|email\s+(preference|setting)/i;
  const UNSUB_HREF_RE = /unsubscribe|optout|opt-out|cancel|preferences|email-settings|notification/i;

  /**
   * Annotate every element that might be an opt-out element with its
   * computed font-size, color, background-color, display, visibility,
   * opacity, and text-decoration so the server detector can see them.
   */
  function annotateComputedStyles() {
    const candidates = document.querySelectorAll('a, button, span, p, small, label, input');
    candidates.forEach(el => {
      try {
        const text = (el.textContent || '').toLowerCase();
        const href = (el.getAttribute('href') || '').toLowerCase();
        const isCandidate = UNSUB_TEXT_RE.test(text) || UNSUB_HREF_RE.test(href);

        if (!isCandidate) return;

        const cs = window.getComputedStyle(el);

        // Write computed values as data-dpd-* attributes
        el.setAttribute('data-dpd-color',      cs.color);
        el.setAttribute('data-dpd-bg',         cs.backgroundColor);
        el.setAttribute('data-dpd-fontsize',   cs.fontSize);
        el.setAttribute('data-dpd-display',    cs.display);
        el.setAttribute('data-dpd-visibility', cs.visibility);
        el.setAttribute('data-dpd-opacity',    cs.opacity);
        el.setAttribute('data-dpd-textdec',    cs.textDecoration);
        el.setAttribute('data-dpd-position',   cs.position);

        // Check if element is actually visible on screen
        const rect = el.getBoundingClientRect();
        const offScreen = rect.width === 0 && rect.height === 0;
        el.setAttribute('data-dpd-offscreen', offScreen ? '1' : '0');

      } catch {}
    });

    // Also annotate ALL elements for general dark pattern checks
    document.querySelectorAll('[class*="countdown"],[class*="timer"],[data-countdown]').forEach(el => {
      el.setAttribute('data-dpd-timer', '1');
    });
  }

  /**
   * Get the full annotated HTML — what the server will actually scan.
   * We cap it at 500KB to stay within reasonable limits.
   */
  function getAnnotatedHtml() {
    annotateComputedStyles();
    const html = document.documentElement.outerHTML;
    return html.length > 500000 ? html.slice(0, 500000) : html;
  }

  /**
   * Inject a floating badge on the page showing the Sus Score.
   */
  function injectBadge(score, patternCount) {
    const existing = document.getElementById('__dpd-badge');
    if (existing) existing.remove();

    if (score === 0) return; // Don't clutter clean pages

    const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    const label = score >= 70 ? '⚠ HIGH RISK' : score >= 40 ? '⚡ MODERATE' : '✓ LOW RISK';

    const badge = document.createElement('div');
    badge.id = '__dpd-badge';
    badge.innerHTML = `
      <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.05em">${label}</div>
      <div style="font-size:24px;font-weight:900;color:white;line-height:1.1">${score}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.75);margin-top:1px">EVIL SCORE</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.6)">${patternCount} pattern${patternCount !== 1 ? 's' : ''}</div>
    `;
    badge.style.cssText = `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      background: ${color} !important;
      background: linear-gradient(135deg, ${color}, ${color}dd) !important;
      border-radius: 14px !important;
      padding: 10px 14px !important;
      text-align: center !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1) !important;
      cursor: pointer !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      min-width: 88px !important;
      transition: transform 0.15s ease, box-shadow 0.15s ease !important;
      user-select: none !important;
    `;
    badge.title = `Sus Score — ${patternCount} patterns found. Click to open full report.`;
    badge.onclick = () => window.open('http://localhost:3000', '_blank');
    badge.onmouseenter = () => {
      badge.style.transform = 'scale(1.06) translateY(-2px)';
      badge.style.boxShadow = `0 8px 25px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)`;
    };
    badge.onmouseleave = () => {
      badge.style.transform = '';
      badge.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)';
    };

    // Auto-dismiss after 12 seconds
    document.body.appendChild(badge);
    setTimeout(() => {
      badge.style.transition = 'opacity 0.4s ease';
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 400);
    }, 12000);
  }

  /**
   * Main scan — grabs annotated HTML and posts to the local API.
   */
  async function scanPage() {
    try {
      const html = getAnnotatedHtml();
      const url  = window.location.href;

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, url }),
      });

      if (!res.ok) return;
      const data = await res.json();

      // Notify background script to update the toolbar badge
      chrome.runtime.sendMessage({
        type: 'SCAN_COMPLETE',
        score: data.susScore ?? 0,
        patterns: data.patterns ?? [],
        totalPatterns: data.totalPatterns ?? 0,
        url,
        tabId: undefined,
      });

      // Show floating badge on the page
      injectBadge(data.susScore ?? 0, data.totalPatterns ?? 0);

    } catch (err) {
      // Silently fail — don't disrupt the page
      console.debug('[SusScore] scan failed:', err.message);
    }
  }

  // Run after page is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPage);
  } else {
    // Slight delay to let JS-rendered content appear
    setTimeout(scanPage, 1500);
  }
})();
