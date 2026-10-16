/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        veltrix: {
          black: '#0a0a0a',
          'black-light': '#141414',
          'black-lighter': '#1a1a1a',
          blue: '#00d4ff',
          'blue-dark': '#0099cc',
          'blue-glow': 'rgba(0, 212, 255, 0.3)',
          white: '#ffffff',
          'gray-100': '#f5f5f5',
          'gray-200': '#e5e5e5',
          'gray-300': '#d4d4d4',
          'gray-400': '#a3a3a3',
          'gray-500': '#737373',
          'gray-600': '#525252',
          'gray-700': '#404040',
          'gray-800': '#262626',
          'gray-900': '#171717',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      }
    },
  },
  plugins: [],
}
