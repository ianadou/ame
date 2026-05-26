import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './components/**/*.{vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Antonio', 'Inter', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'monospace'],
    },
    extend: {
      colors: {
        // Neutres = échelle slate de Tailwind (déjà utilisée partout)
        primary: colors.amber,
        ink: { DEFAULT: '#0F172A', 2: '#1E293B', 3: '#475569', 4: '#64748B' },
        paper: { DEFAULT: '#FFFFFF', 2: '#F8F9FB', 3: '#FFFFFF', 4: '#F3F4F6' },
        line: { DEFAULT: '#E5E7EB', 2: '#D1D5DB', 3: '#9CA3AF' },
        muted: '#64748B',
        // Accents de la maquette
        ochre: {
          DEFAULT: '#D9871A',
          dark: '#A06410',
          deep: '#704309',
          light: '#F0A93C',
          tint: '#FBEACB',
        },
        forest: { DEFAULT: '#10B981', dark: '#047857', light: '#34D399', tint: '#D1FAE5' },
        rust: { DEFAULT: '#EF4444', dark: '#B91C1C', tint: '#FEE2E2' },
        success: {
          light: colors.emerald[50],
          DEFAULT: colors.emerald[600],
          dark: colors.emerald[700],
        },
        warning: { light: colors.amber[50], DEFAULT: colors.amber[600], dark: colors.amber[700] },
        danger: { light: colors.red[50], DEFAULT: colors.red[600], dark: colors.red[700] },
        info: { light: colors.sky[50], DEFAULT: colors.sky[600], dark: colors.sky[700] },
      },
      letterSpacing: {
        display: '-0.015em',
        wider2: '0.14em',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,19,14,0.04), 0 1px 1px rgba(20,19,14,0.03)',
        'soft-md': '0 2px 6px rgba(20,19,14,0.06), 0 1px 2px rgba(20,19,14,0.04)',
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '14px',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.25' }],
      },
    },
  },
} satisfies Config
