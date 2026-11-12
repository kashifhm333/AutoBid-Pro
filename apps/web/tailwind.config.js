/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080B11',
          surface: '#0F1623',
          card: '#151F32',
          cardHover: '#1B273F',
          border: '#22324D',
          borderLight: '#32476B',
          amber: '#F59E0B',
          amberHover: '#D97706',
          emerald: '#10B981',
          emeraldHover: '#059669',
          crimson: '#EF4444',
          crimsonHover: '#DC2626',
          blue: '#3B82F6',
          muted: '#94A3B8',
          text: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-crimson': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'surface': '0 4px 20px -2px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
};
