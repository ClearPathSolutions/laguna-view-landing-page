import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette derived from the reference microsite (brief LAB values -> sRGB)
        cream: "#E3DDD5", // offwhite
        beige: "#F4EEE6", // light beige
        ink: "#011223", // near-black navy (dark grey)
        teal: {
          DEFAULT: "#166876", // teal accent for subheadings
          700: "#12545F",
          900: "#0C3A42",
        },
        gold: {
          DEFAULT: "#C89241", // primary CTA / accent
          600: "#B27E32",
          100: "#EBD9B8",
        },
        body: "#3F4E5D", // primary paragraph text
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(1,18,35,0.04), 0 12px 32px -12px rgba(1,18,35,0.18)",
        cardHover: "0 2px 4px rgba(1,18,35,0.06), 0 20px 44px -14px rgba(1,18,35,0.26)",
        header: "0 1px 0 rgba(1,18,35,0.06), 0 8px 24px -16px rgba(1,18,35,0.30)",
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
