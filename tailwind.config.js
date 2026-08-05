/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Design tokens mirrored from src/constants/theme.ts.
        // Each color exposes a light (DEFAULT) and dark variant, e.g.
        // `bg-background` (light) / `dark:bg-background-dark` (dark).
        text: {
          DEFAULT: "#000000",
          dark: "#ffffff",
        },
        background: {
          DEFAULT: "#ffffff",
          dark: "#17181D",
        },
        "background-element": {
          DEFAULT: "#F0F0F3",
          dark: "#1F2126",
        },
        "background-selected": {
          DEFAULT: "#E0E1E6",
          dark: "#2A2D33",
        },
        "text-secondary": {
          DEFAULT: "#60646C",
          dark: "#9CA1AC",
        },
        border: {
          DEFAULT: "#E0E1E6",
          dark: "#2E3138",
        },
        success: {
          DEFAULT: "#1F8A4C",
          dark: "#34C759",
        },
        danger: {
          DEFAULT: "#D0342C",
          dark: "#FF453A",
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#F59E0B",
        },
        "link-primary": "#3c87f7",
      },
      spacing: {
        half: "2px",
        one: "4px",
        two: "8px",
        three: "16px",
        four: "24px",
        five: "32px",
        six: "64px",
      },
      maxWidth: {
        content: "800px",
      },
      borderRadius: {
        half: "2px",
        one: "4px",
        two: "8px",
        three: "16px",
        four: "24px",
        five: "32px",
        six: "64px",
      },
    },
  },
  plugins: [],
};
