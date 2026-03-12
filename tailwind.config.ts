import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tf: {
          navy: "#0A1A33",
          electric: "#0EA5E9",
          orange: "#F97316",
          slate: "#0F172A",
          cloud: "#F8FAFC",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      boxShadow: {
        panel: "0 20px 40px -24px rgba(10, 26, 51, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
