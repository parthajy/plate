// Single source of truth for design tokens. Mirrors DESIGN.md exactly.
// Tailwind config also references these values — keep them in sync.
//
// `colors` is a mutable object — when the OS theme switches, we Object.assign
// the new palette in and the root layout remounts the tree by key. Screens
// can keep using `colors.X` directly without reaching for a hook.

const darkPalette = {
  bg: '#0b0b0a',
  bgWarm: '#100f0d',
  surface: '#161513',
  surface2: '#1d1c19',
  border: '#28261f',
  borderHi: '#3a3830',

  text: '#f6f3e9',
  text2: '#b8b4a5',
  text3: '#6f6c61',
  textInv: '#000000',

  accent: '#dcff4f',
  accentDim: '#a8c43c',
  accent2: '#ff6a1a',

  good: '#7ee08a',
  warn: '#ffb347',
  danger: '#ff5a5a',

  protein: '#dcff4f',
  carbs: '#ff6a1a',
  fat: '#ffb347',
};

export const colors = { ...darkPalette };

export type ThemeMode = 'light' | 'dark';

export function applyTheme(mode: ThemeMode): void {
  const next = mode === 'light' ? colorsLight : darkPalette;
  Object.assign(colors, next);
}

export const colorsLight = {
  bg: '#faf8f1',
  bgWarm: '#f3efe3',
  surface: '#ffffff',
  surface2: '#f3efe3',
  border: '#e6e0cf',
  borderHi: '#cfc8b3',

  text: '#15140f',
  text2: '#5a574d',
  text3: '#8a857a',
  textInv: '#ffffff',

  accent: '#7a9b00',
  accentDim: '#5d7700',
  accent2: '#c75518',

  good: '#3d8a4a',
  warn: '#c47700',
  danger: '#c93838',

  protein: '#7a9b00',
  carbs: '#c75518',
  fat: '#c47700',
} as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
  9: 96,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

export const type = {
  display1: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.2,
    fontWeight: '400' as const,
  },
  display2: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.8,
    fontWeight: '400' as const,
  },
  display3: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.5,
    fontWeight: '500' as const,
  },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: '400' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '500' as const },
  labelSm: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
  mono: {
    fontFamily: 'Menlo',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
  monoSm: {
    fontFamily: 'Menlo',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.2,
    fontWeight: '500' as const,
  },
} as const;

export const motion = {
  spring: { damping: 18, stiffness: 200, mass: 1 },
  snappy: { damping: 22, stiffness: 380 },
  soft: { damping: 20, stiffness: 140 },
} as const;

// Widen literal hex types to plain strings so the dark + light palettes
// share a structural shape.
export type Colors = { readonly [K in keyof typeof colors]: string };
export type Theme = {
  colors: Colors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
};

export const theme: Theme = { colors, space, radius, type };
export const themeLight: Theme = { colors: colorsLight, space, radius, type };
