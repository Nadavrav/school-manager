/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // זה מוודא ש-Tailwind קורא את ה-JSX שלך
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#137fec',
      },
      fontFamily: {
        'display': ['Rubik', 'sans-serif'],
      },
    },
  },
  plugins: [],
}