/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace', 'ui-monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      boxShadow: {
        'glow-indigo':  '0 0 22px -5px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 22px -5px rgba(16, 185, 129, 0.35)',
        'glow-amber':   '0 0 22px -5px rgba(245, 158, 11, 0.35)',
        'glow-rose':    '0 0 22px -5px rgba(244, 63, 94, 0.35)',
        'glow-cyan':    '0 0 22px -5px rgba(34, 211, 238, 0.35)',
        'card':         '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-lg':      '0 4px 16px -4px rgba(0,0,0,0.10)',
        'inner-sm':     'inset 0 1px 2px 0 rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #818cf8 0%, #6366f1 40%, #22d3ee 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        'gradient-amber': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
        'gradient-rose': 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
        'gradient-dark-card': 'linear-gradient(145deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
      },
      animation: {
        'fade-up':    'fade-up 0.4s ease forwards',
        'scale-in':   'scale-in 0.2s ease forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
