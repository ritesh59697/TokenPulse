/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f19",
        card: "#111827",
        "card-hover": "#161f2e",
        "card-border": "#1e2d45",
        accent: "#3b82f6",
        purple: "#8b5cf6",
        positive: "#22c55e",
        negative: "#ef4444",
        muted: "#4b5563",
        "text-secondary": "#9ca3af",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(30,45,69,0.6)",
        glow: "0 0 20px rgba(59,130,246,0.15)",
        "glow-green": "0 0 20px rgba(34,197,94,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
