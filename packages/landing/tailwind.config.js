const colors = require('tailwindcss/colors');

module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'gray-750': '#2a374a',
        'gray-825': 'rgb(37, 47, 63)',
        'gray-850': 'rgb(26, 32, 44)',

        orange: colors.orange,

        'celo-green': '#35D07F',
        'celo-gold': '#FBCC5C',
      },
    },
  },
  variants: {
    extend: {
      borderRadius: ['first', 'last'],
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
