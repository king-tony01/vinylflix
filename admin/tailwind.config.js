/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vinyl: {
          pink: '#FF0091',
          purple: '#360099',
          violet: '#7928CA',
          magenta: '#E0007E',
          dark: '#0e001f',
          surface: '#15002e',
        },
        brand: {
          500: '#FF0091',
          600: '#db007c',
          700: '#b80068',
        },
      },
      backgroundImage: {
        'vinyl-gradient': 'linear-gradient(135deg, #FF0091 0%, #7928CA 50%, #360099 100%)',
      },
    },
  },
  plugins: [],
}
