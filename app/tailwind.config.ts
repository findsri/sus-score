import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        surface: '#13131a',
        border: '#1e1e2e',
        'border-bright': '#2e2e4e',
        accent: '#2f80c0',
        'accent-light': '#7ec8e3',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        muted: '#6b7280',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gauge-fill': 'gauge-fill 1.5s ease-out forwards',
      },
      keyframes: {
        'gauge-fill': {
          '0%': { strokeDashoffset: '339' },
          '100%': { strokeDashoffset: 'var(--target-offset)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
