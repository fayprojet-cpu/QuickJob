import type { Config } from 'tailwindcss';

/**
 * Identité visuelle : blanc dominant, boutons principaux en noir profond
 * ("primary" — c'est le token que tous les composants boutons/liens/badges
 * utilisent déjà, donc le changer ici suffit à retourner tout le site sans
 * toucher aux fichiers composants), vert forêt réservé aux touches d'accent
 * (jamais le fond d'un bouton plein) — remplace l'ancienne identité
 * terracotta, jugée trop douce.
 *
 * "neutral" reste sur des gris chauds (teinte pierre) : un noir pur marie
 * mal avec un gris froid, un gris chaud garde la page cohérente.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F2F2F2',
          100: '#D9D9D9',
          200: '#B3B3B3',
          300: '#8C8C8C',
          400: '#4D4D4D',
          500: '#1A1A1A',
          600: '#111111',
          700: '#0A0A0A',
          800: '#050505',
          900: '#000000',
        },
        /** Vert forêt — accent, jamais le fond d'un bouton principal. */
        accent: {
          50: '#E8F0EA',
          100: '#C6DBCC',
          200: '#9CC2A6',
          300: '#6FA67D',
          400: '#4C8F5C',
          500: '#2F6B3F',
          600: '#255530',
          700: '#1D4326',
          800: '#15331C',
          900: '#0D2012',
        },
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        /**
         * Tokens sémantiques de statut — un rôle par couleur, jamais utilisés
         * pour du texte/UI de marque (ça reste "primary"). Sert les badges de
         * statut (mission, candidature) et les messages de feedback.
         */
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
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
