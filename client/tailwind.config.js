/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        ink: {
          DEFAULT: '#12151C', // near-black navy, dark-mode base - not pure black
          soft: '#1A1E28',
          raised: '#262D3D', // elevated dark-mode card surface
        },
        paper: {
          DEFAULT: '#F6F2E9', // warm parchment, light-mode base
          soft: '#EFEADD',
        },
        // Accents - each with a distinct semantic role, not decoration
        brass: {
          DEFAULT: '#C1963E', // primary accent: actions, active states, links
          soft: '#DDB868',
          deep: '#96742D',
        },
        verdigris: {
          DEFAULT: '#4A8C82', // secondary accent: assistant voice, tool-use, AI activity
          soft: '#6FA89F',
          deep: '#356359',
        },
        oxblood: {
          DEFAULT: '#A8462F', // critique / warning accent - used sparingly
          soft: '#C36A50',
        },
        surface: {
          dark: '#1C202B',
          darkRaised: '#242A38',
          light: '#FFFFFF',
          lightRaised: '#FBF9F4',
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '0.625rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(18,21,28,0.06), 0 8px 24px -12px rgba(18,21,28,0.18)',
        stamp: '0 0 0 1px rgba(168,70,47,0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(1.4) rotate(-14deg)' },
          '60%': { opacity: '1', transform: 'scale(0.96) rotate(-7deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-6deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'stamp-in': 'stamp-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
