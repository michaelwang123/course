/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './.vitepress/**/*.{vue,js,ts}',
    './**/*.md'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#00ffaa',
      },
      animation: {
        'dash-flow': 'dash-flow 1.5s linear infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'dot-move': 'dot-move 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'shimmer': 'shimmer 3s ease-in-out infinite',
      },
      keyframes: {
        'dash-flow': {
          to: { 'stroke-dashoffset': '-20' }
        },
        'pulse-glow': {
          '0%, 100%': { 'box-shadow': '0 0 8px rgba(0,255,170,0.3), 0 0 16px rgba(0,255,170,0.1)' },
          '50%': { 'box-shadow': '0 0 16px rgba(0,255,170,0.6), 0 0 32px rgba(0,255,170,0.3)' }
        },
        'dot-move': {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(160px)', opacity: '0' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'shimmer': {
          '0%': { 'background-position': '-200% center' },
          '100%': { 'background-position': '200% center' }
        }
      }
    }
  }
}
