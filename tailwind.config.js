/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aicte: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9ec',
          300: '#95bede',
          400: '#619ecb',
          500: '#3c82b5',
          600: '#2c6897',
          700: '#24547b',
          800: '#132e50',
          900: '#0b2545',
          950: '#07182c',
          // Semantic alias tokens
          primary: '#1e3a8a',
          secondary: '#2563eb',
          accent: '#0284c7',
          navy: '#0F2744',
          blue: '#1A4971',
          lightBlue: '#E8F1F5',
          amber: '#D97706',
          orange: '#EA580C',
          gold: '#B45309',
        },
        saffron: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
