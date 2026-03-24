/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Mono", "monospace"],
        body: ["Outfit", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
