import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-dull': '#1f58d8',
        light: '#f1f5f9',
        'border-color': '#c4c7d2',
        'bg-dark': '#1a1a1a',
        'bg-light': '#f8f9fa',
      },
      spacing: {
        'padding-xs': '0.5rem',
        'padding-sm': '0.75rem',
        'padding-md': '1rem',
        'padding-lg': '1.25rem',
        'safe-area-top': 'env(safe-area-inset-top)',
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
      },
      fontSize: {
        'h1': ['1.875rem', { lineHeight: '2.25rem' }],
        'h2': ['1.5rem', { lineHeight: '2rem' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem' }],
        'body': ['0.875rem', { lineHeight: '1.25rem' }],
        'xs-text': ['0.75rem', { lineHeight: '1rem' }],
      },
      minHeight: {
        'screen-nav': 'calc(100vh - 60px)',
        'screen-nav-md': 'calc(100vh - 70px)',
      },
    },
  },
  plugins: [],
  // Important: Configure Tailwind to work with Bootstrap
  corePlugins: {
    preflight: false, // Disable Tailwind preflight to avoid conflicts with Bootstrap
  },
  important: true, // Use !important for Tailwind utilities to override Bootstrap
} satisfies Config;
