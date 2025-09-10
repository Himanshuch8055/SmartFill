/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b1220',
        card: '#0f172a',
        muted: '#94a3b8',
        border: '#20304d',
      },
      boxShadow: {
        brand: '0 10px 24px rgba(37,99,235,.25)'
      }
    },
    container: {
      center: true,
      padding: '1rem',
      screens: {
        lg: '1100px',
      },
    },
  },
  plugins: [],
}
