/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        navy: {
          800: '#131e36',
          850: '#0e172a',
          900: '#0a1020',
          950: '#060a15',
        },
        slate: {
          850: '#111b2e',
          900: '#0c1424',
          950: '#070c18',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          950: '#042238',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.2)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.2)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.2)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.2)',
        'glow-purple': '0 0 20px -3px rgba(168, 85, 247, 0.2)',
      }
    },
  },
  plugins: [],
}
