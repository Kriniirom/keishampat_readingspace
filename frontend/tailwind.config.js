/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F7F4',
          100: '#DDECE5',
          600: '#1B4D36',
          700: '#143D2A',
          800: '#0F3021',
          900: '#0B2318',
          DEFAULT: '#113826',
        },
        sand: {
          50: '#FAF8F5',
          100: '#F4F0EA',
          200: '#E9E3D8',
          300: '#DDD5C4',
          DEFAULT: '#F8F6F0',
        },
        charcoal: {
          800: '#2A302D',
          900: '#1C221F',
          DEFAULT: '#1B2420',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.025)',
        'hero-card': '0 20px 40px -15px rgba(17, 56, 38, 0.08)',
      }
    },
  },
  plugins: [],
};
