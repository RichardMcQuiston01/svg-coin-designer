/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Company palette. White text on `primary` measures 11.28:1, comfortably
        // past WCAG AA. White text on `secondary` is only 4.19:1, so secondary is
        // reserved for focus rings, borders, and large text - never body copy.
        brand: {
          primary: '#1D4228',
          'primary-hover': '#193822',
          'primary-active': '#142E1C',
          secondary: '#5F8560',
          'secondary-hover': '#507151',
        },
      },
      ringColor: {
        // Overrides Tailwind's stock blue focus ring. 4.01:1 against the page
        // background, past the 3:1 WCAG minimum for non-text UI elements.
        DEFAULT: '#5F8560',
      },
      fontFamily: {
        // Headings only, per the project design guidelines. Body text keeps the
        // system stack.
        heading: ['Montserrat', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          from: {opacity: '0', transform: 'translateX(1rem)'},
          to: {opacity: '1', transform: 'translateX(0)'},
        },
      },
      animation: {
        // Used by the notification toast in CoinEditor.
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
