/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2DC8CE',
          dark: '#1A8B91',
          light: '#E3F7F9',
          50: '#F0FAFB',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        phone: '44px',
      },
    },
  },
  plugins: [],
}
