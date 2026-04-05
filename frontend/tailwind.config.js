/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef9ec',
          100: '#fdf1cd',
          200: '#fae09c',
          300: '#f7cb61',
          400: '#f3b133',
          500: '#e8971e', // Platform gold
          600: '#c77516',
          700: '#9c5414',
          800: '#7f4316',
          900: '#6a3816',
        },
        success: '#00B050',
        warning: '#FF9900',
        error: '#C00000',
        background: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
