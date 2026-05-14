/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark theme — keep in sync with mobile/lib/theme.ts
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
      },
      fontFamily: {
        display: ['Fraunces_400Regular', 'serif'],
        displayItalic: ['Fraunces_400Regular_Italic', 'serif'],
        body: ['System'],
        mono: ['Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '22px',
      },
    },
  },
  plugins: [],
};
