import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF1F5",
          100: "#D3DAE4",
          400: "#4A6180",
          600: "#2A3E56",
          700: "#1B2A3D",
          900: "#101A26",
        },
        bronze: {
          50: "#FBF3E7",
          200: "#E8C68A",
          400: "#C08A3E",
          600: "#96692C",
        },
        canvas: "#F4F6F8",
        good: "#2F7D5C",
        warn: "#C08A3E",
        bad: "#B3432B",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
