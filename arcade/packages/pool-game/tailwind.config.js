// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust the path if necessary
  ],
  theme: {
    extend: {
      fontFamily: {
        'pinball': ['"Freckle Face"', 'cursive'],
      },
      textShadow: {
        pinball: '0 0 5px #ff00de, 0 0 10px #ff00de, 0 0 15px #ff00de',
      },
    },
  },
  plugins: [
    require('tailwindcss-textshadow'),
  ],
};
