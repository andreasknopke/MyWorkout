import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#ddebff",
          200: "#bfdcff",
          300: "#92c5ff",
          400: "#5ca4ff",
          500: "#3882ff",
          600: "#1f63f6",
          700: "#174de3",
          800: "#1a41b8",
          900: "#1b3d91"
        }
      }
    }
  },
  plugins: []
};

export default config;
