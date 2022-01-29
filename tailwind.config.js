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
  plugins: [
    // eslint-disable node/no-extraneous-require
    require('@frontile/core/tailwind'),
    require('@frontile/overlays/tailwind'),
    require('@frontile/buttons/tailwind'),
  ],
};
