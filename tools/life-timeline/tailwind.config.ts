import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FFFBF0',
          100: '#FFF3D6',
          200: '#FFE6AD',
          300: '#FFD685',
          400: '#FFC45C',
          500: '#E8A838',
          600: '#C4862A',
          700: '#9B6520',
          800: '#6B4518',
          900: '#3D2810',
        },
      },
      fontFamily: {
        sans: [
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
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 50%, #FEF3C7 100%)',
        'warm-gradient-subtle': 'linear-gradient(180deg, #FFFBF5 0%, #FFF8EE 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
