import type { Config } from 'tailwindcss';

/**
 * Palette "primary" = Material Design Deep Orange, dont #FF5722 est la
 * teinte 500 — c'est la couleur de marque QuickJob demandée. Gammes 50→900
 * pour couvrir fonds clairs, hover, texte sur fond clair/foncé, etc.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBE9E7',
          100: '#FFCCBC',
          200: '#FFAB91',
          300: '#FF8A65',
          400: '#FF7043',
          500: '#FF5722',
          600: '#F4511E',
          700: '#E64A19',
          800: '#D84315',
          900: '#BF360C',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
