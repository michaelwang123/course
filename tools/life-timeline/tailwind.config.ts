import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#030712',
          800: '#0a0f1a',
          700: '#111827',
          600: '#1f2937',
          500: '#374151',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Noto Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'dash-flow': 'dash-flow 1.5s linear infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 8px rgba(52, 211, 153, 0.3), 0 0 16px rgba(52, 211, 153, 0.1)' },
          '50%': { 'box-shadow': '0 0 16px rgba(52, 211, 153, 0.6), 0 0 32px rgba(52, 211, 153, 0.3)' },
        },
        'dash-flow': {
          to: { 'stroke-dashoffset': '-20' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
