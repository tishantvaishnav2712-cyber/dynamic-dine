/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          900: '#0B0F19',
          800: '#121824',
          700: '#1E293B',
        },
        slatebase: '#161B2B',
        neoncyan: '#00E5FF',
        neongreen: '#00E676',
        neonred: '#FF3838',
        goldaccent: '#FFD700',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
