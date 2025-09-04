/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          'from': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          'to': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.react-flow__controls-button': {
          '@apply bg-white border-none rounded-lg text-slate-700 text-lg w-16 h-16 transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 hover:text-slate-900 shadow-md': {},
        },
        '.react-flow__controls-button svg': {
          '@apply fill-slate-700 w-8 h-8': {},
        },
        '.react-flow__controls-button:hover svg': {
          '@apply fill-slate-900': {},
        },
      })
    }
  ],
}
