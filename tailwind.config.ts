import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Cool slate-blue neutral scale used for text and surfaces.
        ink: {
          50: "#f5f8fc",
          100: "#eaeff6",
          200: "#d8e0ec",
          300: "#b7c3d6",
          400: "#8593ab",
          500: "#5c6a82",
          600: "#425067",
          700: "#2d3a50",
          800: "#1c273a",
          900: "#0f1a2c",
        },
        // Brand palette. The class names (indigo / violet / fuchsia) are what the
        // components already use; here they are re-pointed at blue -> sky -> teal.
        indigo: {
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
          500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
        },
        violet: {
          50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8",
          500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e",
        },
        fuchsia: {
          50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf",
          500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 26 44 / 0.04), 0 2px 8px rgb(15 26 44 / 0.05)",
        card: "0 1px 2px rgb(15 26 44 / 0.05), 0 4px 14px -4px rgb(15 26 44 / 0.08)",
        lift: "0 2px 4px rgb(15 26 44 / 0.05), 0 12px 28px -8px rgb(37 99 235 / 0.25)",
        pop: "0 24px 60px -12px rgb(15 26 44 / 0.35)",
        glow: "0 8px 24px -6px rgb(37 99 235 / 0.5)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--r, 0deg))" },
          "50%": { transform: "translateY(-8px) rotate(var(--r, 0deg))" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out both",
        "pop-in": "pop-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "rise-in": "rise-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
