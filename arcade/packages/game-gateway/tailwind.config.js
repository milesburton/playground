module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust according to your project structure
    './public/index.html',
  ],
  theme: {
    extend: {
      textShadow: {
        pinball:
          '0 0 5px rgba(255, 0, 221, 0.7), 0 0 10px rgba(255, 0, 221, 0.5)',
      },
    },
  },
  plugins: [require('tailwindcss-textshadow')],
};
