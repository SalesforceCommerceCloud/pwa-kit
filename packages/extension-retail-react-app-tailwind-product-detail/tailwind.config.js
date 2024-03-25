/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')


module.exports = {
  content: ["./app/**/*.{html,ts,tsx,js}"],
  theme: {
    extend: {
      gridTemplateRows: {
        '[auto,auto,1fr]': 'auto auto 1fr',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}
