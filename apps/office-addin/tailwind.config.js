/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'absentbox-red': '#EF5B5B',
        'absentbox-dark': '#1E293B',
      }
    },
  },
  plugins: [],
}
