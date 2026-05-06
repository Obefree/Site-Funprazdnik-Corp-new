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
          DEFAULT: "#7A4C2A",
          hover: "#5F3A20",
          soft: "#F3E8D6",
          ink: "#3D2615",
        },
        ink: "#1F2A21",
        muted: "#5F6D60",
        surface: "#F5F3EC",
        line: "#D9D4C8",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
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
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
        card: "0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.04)",
        hover: "0 2px 6px rgba(16,24,40,0.06), 0 16px 40px rgba(16,24,40,0.08)",
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
