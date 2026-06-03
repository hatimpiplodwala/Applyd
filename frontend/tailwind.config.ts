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
        // Two real elevations — everything else maps onto these.
        paper: "0 1px 2px rgba(45, 40, 30, 0.05)",
        "paper-raised": "0 1px 2px rgba(45, 40, 30, 0.05)",
        "paper-hover": "0 4px 16px -6px rgba(45, 40, 30, 0.12)",
        "paper-press": "none",
        "forest-button": "0 1px 2px rgba(45, 55, 35, 0.18)",
        "forest-button-hover": "0 2px 8px -2px rgba(45, 55, 35, 0.26)",
        // Subtle focus/drop affordance only (used by kanban drop target + today bar).
        "forest-glow": "0 0 0 3px hsl(var(--ring) / 0.16)",
        ring: "0 0 0 3px hsl(var(--ring) / 0.2)",
        "inner-paper": "none",
      },
      backgroundImage: {
        "gloss-paper":
          "linear-gradient(hsl(var(--surface-raised)), hsl(var(--surface-raised)))",
        "gloss-cream":
          "linear-gradient(hsl(var(--surface)), hsl(var(--surface)))",
        "gloss-forest":
          "linear-gradient(hsl(var(--primary)), hsl(var(--primary)))",
        "gloss-forest-hover":
          "linear-gradient(hsl(96 22% 34%), hsl(96 22% 34%))",
        "gloss-oak":
          "linear-gradient(hsl(var(--accent)), hsl(var(--accent)))",
        "shine-top": "none",
        "shine-row": "none",
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
