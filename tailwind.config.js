/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#48A6A7',
        secondary: '#6b7280',
        background: '#f9fafb',
        muted: '#f3f4f6',
        border: '#e5e7eb',
        // Add dark mode colors
        'background-dark': '#0f172a',
        'muted-dark': '#1e293b',
        'border-dark': '#334155',
        'primary-dark': '#60a5fa',
        'secondary-dark': '#94a3b8',
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        glow: '2px 0 10px rgba(37, 99, 235, 0.3)',
      },
    },
  },
  plugins: [],
};
