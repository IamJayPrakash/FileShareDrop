/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#6b7280',
        background: '#f9fafb',
        muted: '#f3f4f6',
        border: '#e5e7eb',
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      },
    },
  },
  plugins: [require('tw-animate-css')],
};
