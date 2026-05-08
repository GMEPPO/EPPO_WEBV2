/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f1419',
          card: '#1a2332',
          cardHover: '#243044',
          border: '#2d3a4f',
        }
      }
    },
  },
  plugins: [],
}
