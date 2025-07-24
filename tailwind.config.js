/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'kollects-gold': '#FFB800',
        'energy-orange': '#FF6B35',
        'action-red': '#E63946',
        'deep-navy': '#1D3557',
        'court-black': '#0A0A0A',
      },
      fontFamily: {
        'terminal': ['Courier New', 'monospace'],
        'bloomberg': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #FFB800' },
          '100%': { boxShadow: '0 0 20px #FFB800, 0 0 30px #FFB800' },
        }
      }
    },
  },
  plugins: [],
} 