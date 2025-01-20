/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["light", "dark", "retro", "forest", "lemonade", "coffee", "nord"],
  },
  plugins: [require("daisyui")],
};
