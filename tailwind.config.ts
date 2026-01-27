import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Propel Health branding colors
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: "#0C8181", // Teal - headers, buttons, links
          foreground: "#FFFFFF",
          50: "#A0F1F1",
          100: "#7AEAEA",
          200: "#54E3E3",
          300: "#30D9D8",
          400: "#21B5B5",
          500: "#0C8181",
          600: "#0A6B6B",
          700: "#085555",
          800: "#063F3F",
          900: "#042929",
        },
        // Secondary brand color (Gold accent)
        secondary: {
          DEFAULT: "#F9BC15", // Gold - CTAs, highlights
          foreground: "#34353F",
        },
        // Dark navy for contrast
        navy: {
          DEFAULT: "#34353F",
          foreground: "#FFFFFF",
        },
        // Background colors
        background: "#F8FAFB", // Light gray page background
        surface: "#FFFFFF", // White cards, modals
        // Text colors
        foreground: "#34353F", // Dark navy - body text
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B", // Slate - muted text, labels
        },
        // Status colors
        success: {
          DEFAULT: "#059669", // Green - approved, positive
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F9BC15", // Gold - pending, caution (matches brand)
          foreground: "#34353F",
        },
        destructive: {
          DEFAULT: "#DC2626", // Red - errors, Must Have priority
          foreground: "#FFFFFF",
        },
        // UI colors
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#0C8181", // Teal focus ring
        // Card
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#34353F",
        },
        // Popover
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#34353F",
        },
        // Accent (light blue from palette)
        accent: {
          DEFAULT: "#8DAFCD",
          foreground: "#34353F",
        },
        // Propel-specific colors
        propel: {
          navy: "#34353F",
          gold: "#F9BC15",
          teal: "#0C8181",
          "teal-medium": "#21B5B5",
          cyan: "#30D9D8",
          "cyan-light": "#A0F1F1",
          "blue-light": "#8DAFCD",
        },
      },
      // Propel branding fonts
      fontFamily: {
        sans: ["Montserrat", "Arial", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      // Border radius tokens
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "16px",
      },
      // Animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
