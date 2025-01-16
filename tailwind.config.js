/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          250: '#f9fafb',
          750: '#868686',
          850: '#121212',
        }
      },
      fontFamily: {
        familjenGrotesk: ["Familjen Grotesk", 'serif'],
      },
      boxShadow: {
        'search': '2px 5px 3px #0000000D',
      }
    },
  },
  plugins: [],
}