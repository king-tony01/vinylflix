import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vinyl: {
          pink: '#FF0091',
          purple: '#360099',
          violet: '#7928CA',
          magenta: '#E0007E',
          dark: '#0a0017',
          card: '#120029',
          border: '#2a0054',
        },
      },
      backgroundImage: {
        'vinyl-gradient': 'linear-gradient(135deg, #FF0091 0%, #7928CA 50%, #360099 100%)',
        'vinyl-radial': 'radial-gradient(circle at 50% 0%, rgba(255, 0, 145, 0.22), transparent 60%)',
      },
    },
  },
  plugins: [],
};
export default config;
