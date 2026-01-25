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
      // Providence branding colors
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: "#0F766E", // Teal - headers, buttons, links
          foreground: "#FFFFFF",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        // Secondary brand color
        secondary: {
          DEFAULT: "#1E3A5F", // Navy - gradients, accents
          foreground: "#FFFFFF",
        },
        // Background colors
        background: "#F8FAFB", // Light gray page background
        surface: "#FFFFFF", // White cards, modals
        // Text colors
        foreground: "#1E293B", // Dark slate - body text
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
          DEFAULT: "#D97706", // Orange - pending, caution
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#DC2626", // Red - errors, Must Have priority
          foreground: "#FFFFFF",
        },
        // UI colors
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#0F766E",
        // Card
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1E293B",
        },
        // Popover
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1E293B",
        },
        // Accent
        accent: {
          DEFAULT: "#F1F5F9",
          foreground: "#1E293B",
        },
      },
      // Providence branding fonts
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
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
