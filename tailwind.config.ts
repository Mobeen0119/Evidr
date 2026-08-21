import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        case: {
          bg: "#080a0d",
          panel: "#0e131a",
          panel2: "#131a23",
          border: "#232c38",
          text: "#eef1f5",
          muted: "#8a96a6",
          amber: "#4fc3f7",
          red: "#ff5f5f",
          green: "#34d399",
          cyan: "#4fc3f7"
        }
      },
      boxShadow: {
        evidence: "0 0 28px rgba(79,195,247,.1), inset 0 1px rgba(255,255,255,.04)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-display)", "sans-serif"],
        heading: ["var(--font-display)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
