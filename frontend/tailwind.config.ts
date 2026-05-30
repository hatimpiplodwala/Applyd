import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          sunken: "hsl(var(--surface-sunken))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          mid: "hsl(var(--ink-mid))",
          soft: "hsl(var(--ink-soft))",
        },
        status: {
          applied: {
            bg: "hsl(var(--status-applied-bg))",
            fg: "hsl(var(--status-applied-fg))",
            border: "hsl(var(--status-applied-border))",
            dot: "hsl(var(--status-applied-dot))",
          },
          screen: {
            bg: "hsl(var(--status-screen-bg))",
            fg: "hsl(var(--status-screen-fg))",
            border: "hsl(var(--status-screen-border))",
            dot: "hsl(var(--status-screen-dot))",
          },
          interview: {
            bg: "hsl(var(--status-interview-bg))",
            fg: "hsl(var(--status-interview-fg))",
            border: "hsl(var(--status-interview-border))",
            dot: "hsl(var(--status-interview-dot))",
          },
          offer: {
            bg: "hsl(var(--status-offer-bg))",
            fg: "hsl(var(--status-offer-fg))",
            border: "hsl(var(--status-offer-border))",
            dot: "hsl(var(--status-offer-dot))",
          },
          rejected: {
            bg: "hsl(var(--status-rejected-bg))",
            fg: "hsl(var(--status-rejected-fg))",
            border: "hsl(var(--status-rejected-border))",
            dot: "hsl(var(--status-rejected-dot))",
          },
          withdrawn: {
            bg: "hsl(var(--status-withdrawn-bg))",
            fg: "hsl(var(--status-withdrawn-fg))",
            border: "hsl(var(--status-withdrawn-border))",
            dot: "hsl(var(--status-withdrawn-dot))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        paper:
          "0 1px 2px rgba(59, 47, 27, 0.04), 0 1px 1px rgba(59, 47, 27, 0.03)",
        "paper-raised":
          "0 2px 4px rgba(59, 47, 27, 0.06), 0 4px 12px -4px rgba(59, 47, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        "paper-hover":
          "0 4px 8px rgba(59, 47, 27, 0.07), 0 12px 24px -8px rgba(59, 47, 27, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
        "paper-press":
          "inset 0 2px 4px rgba(59, 47, 27, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.4)",
        "forest-button":
          "0 1px 2px rgba(42, 46, 26, 0.4), 0 4px 12px -2px rgba(66, 72, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.15)",
        "forest-button-hover":
          "0 2px 6px rgba(42, 46, 26, 0.5), 0 8px 20px -4px rgba(66, 72, 42, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
        "forest-glow":
          "0 0 0 4px rgba(66, 72, 42, 0.08), 0 0 18px -4px rgba(66, 72, 42, 0.25)",
        ring: "0 0 0 3px hsl(var(--ring) / 0.2)",
        "inner-paper": "inset 0 1px 2px rgba(59, 47, 27, 0.08)",
      },
      backgroundImage: {
        "gloss-paper":
          "linear-gradient(to bottom, hsl(var(--surface-raised)) 0%, hsl(var(--surface)) 100%)",
        "gloss-cream":
          "linear-gradient(to bottom, #FFFBF3 0%, #F7F1E4 100%)",
        "gloss-forest":
          "linear-gradient(to bottom, hsl(96 24% 38%) 0%, hsl(96 24% 26%) 100%)",
        "gloss-forest-hover":
          "linear-gradient(to bottom, hsl(96 24% 41%) 0%, hsl(96 24% 28%) 100%)",
        "gloss-oak":
          "linear-gradient(to bottom, #A38560 0%, #7C5E3D 100%)",
        "shine-top":
          "linear-gradient(to bottom, rgba(255, 255, 255, 0.5), transparent 50%)",
        "shine-row":
          "linear-gradient(to right, transparent, rgba(120, 100, 70, 0.12) 50%, transparent)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 200ms ease-out",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
