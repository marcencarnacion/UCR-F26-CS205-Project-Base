/** @type {import('tailwindcss').Config} */
const indigoShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const dynamicIndigo = Object.fromEntries(
  indigoShades.map((shade) => [
    shade,
    `rgb(var(--color-indigo-${shade}) / <alpha-value>)`,
  ]),
)

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: dynamicIndigo,
      },
    },
  },
  plugins: [],
}
