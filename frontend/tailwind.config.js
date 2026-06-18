/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0a0e13",
        panel: {
          DEFAULT: "#111827",
          raised: "#1a2332",
          hover: "#212d3d",
        },
        border: {
          hairline: "#1e2a3a",
          subtle: "#2a3a4e",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#06b6d4",
        },
        priority: {
          critico: "#ef4444",
          "critico-dim": "rgba(239, 68, 68, 0.12)",
          "critico-glow": "rgba(239, 68, 68, 0.25)",
          alto: "#f59e0b",
          "alto-dim": "rgba(245, 158, 11, 0.12)",
          "alto-glow": "rgba(245, 158, 11, 0.25)",
          medio: "#3b82f6",
          "medio-dim": "rgba(59, 130, 246, 0.12)",
          "medio-glow": "rgba(59, 130, 246, 0.25)",
        },
        status: {
          ok: "#22c55e",
          "ok-glow": "rgba(34, 197, 94, 0.3)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "slide-in": "slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.3s ease-out",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.6, transform: "scale(1.2)" },
        },
        "slide-in": {
          from: { opacity: 0, transform: "translateY(-8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px 0 var(--glow-color, rgba(59,130,246,0.2))" },
          "50%": { boxShadow: "0 0 20px 4px var(--glow-color, rgba(59,130,246,0.35))" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
