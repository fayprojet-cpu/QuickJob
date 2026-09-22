import type { Config } from 'tailwindcss';

/**
 * Palette "primary" — terracotta/brique profond, une évolution du orange
 * Material Design de départ (#FF5722, "Deep Orange 500" — le orange
 * générique de n'importe quel starter Material). Même famille de teinte
 * (aucune rupture de marque), mais nettement plus sombre et plus riche —
 * un ton terre/brique plutôt qu'un orange vif de signalétique, cohérent
 * avec l'ancrage Afrique de l'Ouest/Centrale du projet.
 *
 * "neutral" est remappé sur des gris CHAUDS (teinte pierre) au lieu du gris
 * froid par défaut : sans ça, un texte gris neutre "froid" jure visuellement
 * à côté d'un orange aussi chaud. Un seul réglage ici change l'ambiance de
 * chaque page (aucun fichier composant à toucher, tout passe déjà par les
 * classes text-neutral-… / bg-neutral-…).
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FBE8DD',
          100: '#F5CBAE',
          200: '#EAA476',
          300: '#DC7C47',
          400: '#C85F2A',
          500: '#A8451A',
          600: '#8A3714',
          700: '#6E2B10',
          800: '#54210C',
          900: '#3A1608',
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
