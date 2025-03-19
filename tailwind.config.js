/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          primary: "#3B82F6",
          secondary: "#10B981",
          accent: "#F97316",
          neutral: "#3D4451",
          "base-100": "#FFFFFF",
          "base-200": "#F9FAFB",
          "base-300": "#F3F4F6",
          info: "#0EA5E9",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
} 