import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0A0A0D",
          soft: "#0D0D11",
        },
        surface: {
          DEFAULT: "#131318",
          raised: "#1A1A22",
          overlay: "#1E1E27",
        },
        border: {
          DEFAULT: "#26262F",
          strong: "#33333F",
        },
        accent: {
          DEFAULT: "#7C5CFF",
          soft: "#9B82FF",
          dim: "#4C3B99",
        },
        text: {
          primary: "#F2F1F7",
          secondary: "#8B8A99",
          tertiary: "#5C5B68",
        },
        status: {
          healthy: "#34D399",
          slow: "#F5A623",
          failed: "#F45B69",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.4), 0 0 24px rgba(124,92,255,0.35)",
        panel: "0 8px 40px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "slide-in-right": {
          from: { transform: "translateX(24px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.28s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.16s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
