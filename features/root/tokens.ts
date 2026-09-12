/**
 * Design Tokens — Ember & Root Frozen Palette
 * Source: docs/UI_UX_BRIEF.md
 *
 * These values must not be changed without Deeptiman's sign-off.
 */
export const TOKENS = {
  color: {
    bg: '#141713',
    surface: '#1D231D',
    surfaceHover: '#262E26',
    textPrimary: '#F0E7D3',
    textSecondary: '#B9BEAC',
    ember: '#E98A4B',
    emberCore: '#FFD38A',
    root: '#9FBA87',
    rootMature: '#D9E3B2',
    error: '#F0A79D',
    errorBg: '#2B1A1A',
    focus: '#C4A96A',
    nodeLocked: '#2A322A',
    borderLocked: '#3B463B',
    borderDefault: '#2B352B',
    borderRootSubtle: 'rgba(159, 186, 135, 0.15)',
    borderEmberSubtle: 'rgba(233, 138, 75, 0.3)',
    borderEmberCoreSubtle: 'rgba(255, 211, 138, 0.3)',
  },
  font: {
    display: 'Fraunces, Georgia, serif',
    ui: 'DM Sans, system-ui, -apple-system, sans-serif',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '10px',
    card: '12px',
  },
} as const;

export type TokenColor = keyof typeof TOKENS.color;
