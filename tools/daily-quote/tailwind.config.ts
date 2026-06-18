import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: '#FFFDF5',
          'bg-alt': '#FDF8EC',
          text: '#2D2A26',
          'text-muted': '#5C5650',
          accent: '#8B7355',
          border: '#E8DFD0',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
