/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Корпоративная палитра «Тиффани» #43C7CA
        primary: {
          50: "#effcfc",
          100: "#d7f6f7",
          200: "#b4eff0",
          300: "#80e3e5",
          400: "#43c7ca",   // ← основной корпоративный цвет
          500: "#2aafb3",
          600: "#258d96",
          700: "#24727a",
          800: "#255d64",
          900: "#234d54",
        },
        accent: {
          50: "#f0fdfa",
          100: "#ccfbef",
          200: "#99f6e0",
          300: "#5fe4c9",
          400: "#2dd4ad",
          500: "#14b894",
          600: "#0d9478",
          700: "#0f7663",
          800: "#115e50",
          900: "#134d43",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};
