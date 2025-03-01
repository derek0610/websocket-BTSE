/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        highlight: {
          '0%, 25%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        sizeChange: {
          '0%, 25%': { opacity: '1' },
          '100%': { opacity: '0' },
        }
      },
      animation: {
        highlight: 'highlight 2s ease-out',
        sizeChange: 'sizeChange 2s ease-out',
      }
    },
  },
  plugins: [],
}