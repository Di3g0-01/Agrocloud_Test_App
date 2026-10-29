/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: '#0f1115',
        panel: '#171a21',
        panelBorder: '#262b36',
        panelHover: '#1b1f28',
        panelActive: '#1f2430',
        accent: '#16a34a',
        accentHover: '#15803d',
        error: '#dc2626',
        warning: '#d97706'
      }
    },
  },
  plugins: [],
}
