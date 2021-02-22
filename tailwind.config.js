module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        'gray-750': '#2a374a',
        'gray-825': 'rgb(37, 47, 63)',
        'gray-850': 'rgb(26, 32, 44)',
      },
    },
  },
  variants: {
    extend: {
      borderRadius: ['first', 'last'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
