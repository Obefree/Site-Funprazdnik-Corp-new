import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4E7D2F",
          hover: "#3E6424",
          soft: "#EBF4E2",
          ink: "#1C3310",
        },
        ink: "#222B1A",
        muted: "#667358",
        surface: "#F5EFE1",
        line: "#DDD4BE",
        gold: "#C9943A",
        lime: "#9DC044",
        cream: "#FAF6ED",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 5vw + 1rem, 4.75rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 3.5vw + 1rem, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.5rem, 2vw + 1rem, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(34,43,26,0.05), 0 6px 20px rgba(34,43,26,0.07)",
        card: "0 1px 2px rgba(34,43,26,0.04), 0 2px 8px rgba(34,43,26,0.05)",
        hover: "0 2px 6px rgba(34,43,26,0.06), 0 14px 36px rgba(34,43,26,0.09)",
        btn: "0 1px 0 rgba(255,255,255,0.18) inset, 0 1px 3px rgba(34,43,26,0.18)",
      },
      spacing: {
        "18": "4.5rem",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
