/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './docs/**/*.{md,mdx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: '#00ffaa',
        'bg-base': '#030712',
        'bg-soft': '#111827',
        'bg-mute': '#1f2937',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
