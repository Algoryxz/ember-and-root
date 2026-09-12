import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ember-bg': 'var(--color-bg)',
        'ember-surface': 'var(--color-surface)',
        'ember-text-primary': 'var(--color-text-primary)',
        'ember-text-secondary': 'var(--color-text-secondary)',
        'ember-copper': 'var(--color-ember)',
        'ember-core': 'var(--color-ember-core)',
        'root-sage': 'var(--color-root)',
        'root-mature': 'var(--color-root-mature)',
        'ember-error': 'var(--color-error)',
        'ember-focus': 'var(--color-focus)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
