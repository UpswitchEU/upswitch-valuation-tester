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
        // Upswitch Brand Colors - Sage Foundation Primary
        primary: {
          50: '#F2F5F3',
          100: '#E1E8E3',
          200: '#C4D1C9',
          300: '#A2B6A9',
          400: '#7E9888',
          500: '#607C6B',
          600: '#4A5D4F', // Sage Foundation
          700: '#3D4D41',
          800: '#323E35',
          900: '#28312B',
          DEFAULT: '#4A5D4F',
        },
        // Accent - Burnt Clay
        accent: {
          50: '#FBF6F4',
          100: '#F6EBE7',
          200: '#EBD6CE',
          300: '#DEBDB0',
          400: '#D09F8E',
          500: '#C87F63', // Burnt Clay
          600: '#B3684D',
          700: '#96533C',
          800: '#7A4433',
          900: '#63392D',
          DEFAULT: '#C87F63',
        },
        // Backgrounds
        canvas: {
          DEFAULT: '#F4F1EA', // Canvas
          50: '#FCFBF9',
          100: '#F4F1EA',
          200: '#EAE5DB',
        },
        // Text
        slate: {
          ink: '#2B303A', // Slate Ink
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
        elevated: '0 12px 24px -6px rgba(74, 93, 79, 0.15)', // Updated to Sage shadow
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
              DEFAULT: '#4A5D4F', // Sage Foundation
              foreground: '#ffffff',
            },
            secondary: {
              DEFAULT: '#C87F63', // Burnt Clay
              foreground: '#ffffff',
            },
            background: '#F4F1EA', // Canvas
            foreground: '#2B303A', // Slate Ink
          },
        },
      },
    }),
  ],
};

export default config;
