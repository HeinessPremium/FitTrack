import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { lg: "1080px", xl: "1080px" },
    },
    extend: {
      colors: {
        ink: "#14181A",
        canvas: "#FFFFFF",
        tint: "#F4F7F5",
        brand: {
          DEFAULT: "#1E6F5C",
          dark: "#154F42",
          soft: "#E1F1EC",
          accent: "#FF6B4A",
          "accent-soft": "#FFE4DB",
          lime: "#C6F135",
        },
        border: "rgba(20,24,26,0.10)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { transform: "translateY(14px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.22,0.9,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
