/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        starBg: '#050810',
        starIndigo: '#6366f1',
        starMuted: '#94a3b8',
        starGold: '#f0c040',
        starBlue: '#93c5fd'
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
}
