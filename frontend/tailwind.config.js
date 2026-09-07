/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "oklch(0.15 0.035 292)",
        card: "oklch(0.205 0.032 290)",
        chip: "oklch(0.18 0.03 290)",
        ink: "oklch(0.96 0.006 290)",
        muted: "oklch(0.68 0.02 290)",
        dim: "oklch(0.52 0.02 290)",
        line: "oklch(1 0 0 / 10%)",
        "line-soft": "oklch(1 0 0 / 6%)",
        magenta: "oklch(0.72 0.19 345)",
        violet: "oklch(0.66 0.2 300)",
        cyan: "oklch(0.78 0.14 210)",
        gold: "oklch(0.8 0.15 85)",
        "accent-ink": "oklch(0.14 0.02 290)",
        "cyan-tint": "oklch(0.78 0.14 210 / 16%)",
        "violet-tint": "oklch(0.66 0.2 300 / 16%)",
        "gold-tint": "oklch(0.8 0.15 85 / 16%)",
        "gold-line": "oklch(0.8 0.15 85 / 45%)",
      },
      fontFamily: {
        display: ["Unbounded", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
