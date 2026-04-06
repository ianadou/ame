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
    },
    extend: {
      colors: {
        primary: colors.indigo,
        success: {
          light: colors.emerald[50],
          DEFAULT: colors.emerald[600],
          dark: colors.emerald[700],
        },
        warning: {
          light: colors.amber[50],
          DEFAULT: colors.amber[600],
          dark: colors.amber[700],
        },
        danger: {
          light: colors.red[50],
          DEFAULT: colors.red[600],
          dark: colors.red[700],
        },
        info: {
          light: colors.sky[50],
          DEFAULT: colors.sky[600],
          dark: colors.sky[700],
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
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
