export function GlobalStyle() {
    return (
      <style>{`
        .dc-root {
          --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --font-display: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
          --bg: #FAFAF7;
          --surface: #FFFFFF;
          --ink: #1C1B29;
          --ink-soft: #6B6875;
          --ink-faint: #A9A6B0;
          --accent: #4A47A3;
          --accent-soft: #EEECFB;
          --good: #2E9E6B;
          --good-soft: #E4F5EC;
          --again: #DD5B4F;
          --again-soft: #FBEAE8;
          --gold: #D69A00;
          --gold-soft: #FBF1DC;
          --border: #E9E6E0;
          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-body);
          min-height: 100%;
          -webkit-tap-highlight-color: transparent;
        }
        .dc-display { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.01em; }
        .dc-mono { font-family: var(--font-mono); }
  
        .dc-surface {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
        }
        .dc-btn {
          border-radius: 12px;
          font-family: var(--font-body);
          font-weight: 600;
          transition: transform .12s ease, opacity .12s ease;
        }
        .dc-btn:active { transform: scale(0.97); }
        .dc-btn:focus-visible, .dc-tappable:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
  
        .flip-scene { perspective: 1400px; }
        .flip-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
        }
        .flip-card.is-flipped { transform: rotateY(180deg); }
        .flip-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
        }
        .flip-face-back { transform: rotateY(180deg); }
  
        .mastery-dots { display: flex; gap: 3px; }
        .mastery-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border); }
        .mastery-dot.filled { background: var(--accent); }
  
        @media (prefers-reduced-motion: reduce) {
          .flip-card { transition: none; }
        }
      `}</style>
    );
  }