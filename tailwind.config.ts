import { heroui } from '@heroui/theme';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/components/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Upswitch Brand Colors - Teal Primary
        primary: {
          50: '#F0FDFC',
          100: '#CCFBF6',
          200: '#99F6EB',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#14B8A6',
        },
        success: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        elevated: '0 12px 24px -6px rgba(20, 184, 166, 0.15)',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    containerQueries,
    forms,
    heroui({
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#14B8A6',
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
};

export default config;
