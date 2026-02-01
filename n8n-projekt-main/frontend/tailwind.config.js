/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#050508",
          paper: "#0A0A0F",
          overlay: "rgba(5, 5, 8, 0.8)"
        },
        primary: {
          DEFAULT: "#FFD700",
          glow: "rgba(255, 215, 0, 0.5)",
          foreground: "#000000"
        },
        secondary: {
          DEFAULT: "#4CC9F0",
          glow: "rgba(76, 201, 240, 0.3)",
          foreground: "#FFFFFF"
        },
        neutral: {
          100: "#FFFFFF",
          200: "#E2E2E2",
          300: "#A0A0A0",
          400: "#525252",
          500: "#262626",
          600: "#171717",
          700: "#0A0A0A",
          800: "#050505",
          900: "#000000"
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
        border: "rgba(255, 255, 255, 0.08)",
        input: "rgba(255, 255, 255, 0.1)",
        ring: "#FFD700",
        foreground: "#FFFFFF",
        muted: {
          DEFAULT: "#262626",
          foreground: "#A0A0A0"
        },
        accent: {
          DEFAULT: "#4CC9F0",
          foreground: "#FFFFFF"
        },
        popover: {
          DEFAULT: "#0A0A0F",
          foreground: "#FFFFFF"
        },
        card: {
          DEFAULT: "rgba(10, 10, 15, 0.6)",
          foreground: "#FFFFFF"
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF"
        }
      },
      fontFamily: {
        heading: ["Unbounded", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 20px rgba(255, 215, 0, 0.15)",
        "glow-lg": "0 0 30px rgba(255, 215, 0, 0.3)",
        deep: "0 20px 50px -12px rgba(0, 0, 0, 0.9)",
        "blue-glow": "0 0 20px rgba(76, 201, 240, 0.2)"
      },
      backdropBlur: {
        glass: "24px"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
