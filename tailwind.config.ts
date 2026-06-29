import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marque "eau / propreté" — cyan profond
        brand: {
          DEFAULT: "#0891B2", // cyan-600
          dark: "#0E7490", // cyan-700
          light: "#ECFEFF", // cyan-50
        },
        // Accent "urgence / express" — orange
        accent: {
          DEFAULT: "#F97316", // orange-500
          dark: "#EA580C", // orange-600
          light: "#FFF7ED", // orange-50
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0E7490 0%, #0891B2 55%, #06B6D4 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
