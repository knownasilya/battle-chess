module.exports = {
  content: [`./app/**/*.{html,js,ts,hbs}`],
  theme: {
    extend: {
      gridTemplateRows: {
        // Simple 8 row grid
        8: 'repeat(8, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};
