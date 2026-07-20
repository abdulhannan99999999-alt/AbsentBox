/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'ab': {
          'red': '#D4654A',
          'red-light': '#EF5B5B',
          'red-dark': '#B84A33',
          'orange': '#E8734A',
          'blue': '#2A579A',
          'blue-light': '#4A7CC9',
          'green': '#4CAF50',
          'green-dark': '#388E3C',
          'teal': '#26A69A',
          'purple': '#7C4DFF',
          'dark': '#1E293B',
          'gray': '#64748B',
        },
        'pill': {
          'high': '#EF5B5B',
          'customer': '#4CAF50',
          'supervisor': '#E8734A',
          'cc': '#2A579A',
          'meetings': '#1A365D',
          'uncategorized': '#94A3B8',
          'newsletter': '#26A69A',
          'spam': '#374151',
        },
      },
      borderRadius: {
        'ab': '12px',
        'ab-lg': '20px',
      },
      boxShadow: {
        'ab': '0 4px 24px rgba(0, 0, 0, 0.08)',
        'ab-lg': '0 12px 40px rgba(0, 0, 0, 0.12)',
        'ab-glow': '0 0 20px rgba(212, 101, 74, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'slide-right': 'slideInRight 0.3s ease-out forwards',
        'slide-left': 'slideInLeft 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-ring': 'pulse-ring 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(212, 101, 74, 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(212, 101, 74, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(212, 101, 74, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
