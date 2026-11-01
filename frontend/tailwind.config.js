import colors from 'tailwindcss/colors'

/**
 * GymPulse design tokens: a dark "control panel" look.
 * ink/surface = backgrounds, line = borders, fg/muted/subtle = text, brand = electric cyan.
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070a14',
        surface: { DEFAULT: '#0c1222', 2: '#111a2e', 3: '#172238' },
        line: { DEFAULT: '#1e2a45', strong: '#2c3b5f' },
        fg: '#e8ecf8',
        muted: '#9ba7c6',
        subtle: '#6c7999',
        brand: {
          50: '#e6fbff', 100: '#c4f4ff', 200: '#8eeaff', 300: '#57dcff', 400: '#22c8f5',
          500: '#0aa8d6', 600: '#0886ad', 700: '#0b6a89', 800: '#0f5670', 900: '#11475c',
        },
        violet: colors.violet,
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,200,245,.35), 0 8px 30px -8px rgba(34,200,245,.45)',
        panel: 'inset 0 1px 0 rgba(255,255,255,.04), 0 10px 30px -15px rgba(0,0,0,.6)',
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'fade-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        'slide-in': 'slide-in .25s cubic-bezier(.2,.8,.2,1)',
        'fade-up': 'fade-up .25s ease-out',
      },
    },
  },
  plugins: [],
}
