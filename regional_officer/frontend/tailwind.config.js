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
          navy: '#0F2744',
          blue: '#1A4971',
          lightBlue: '#E8F1F5',
          amber: '#D97706',
          orange: '#EA580C',
          gold: '#B45309',
        },
      },
    },
  },
  plugins: [],
}
