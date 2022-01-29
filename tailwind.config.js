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
    require('@frontile/forms/tailwind'),
    require('@frontile/notifications/tailwind'),
  ],
  purge: {
    options: {
      safelist: [
        // Frontile Core
        /^close-button/,
        /^visually-hidden/,

        // Frontile Forms
        /^form-field-checkbox/,
        /^form-field-feedback/,
        /^form-field-hint/,
        /^form-field-input/,
        /^form-field-label/,
        /^form-field-radio/,
        /^form-field-textarea/,
        /^form-input/,
        /^form-textarea/,
        /^form-select/,
        /^form-checkbox/,
        /^form-radio/,
        /^form-checkbox-group/,
        /^form-radio-group/,

        // Frontile Notifications
        /^notifications-container/,
        /^notification-card/,
        /^notification-transition/,

        // Frontile Overlays
        /^overlay/,
        /^modal/,
        /^drawer/,

        // Frontile Buttons
        /^btn/,
      ],
    },
  },
};
