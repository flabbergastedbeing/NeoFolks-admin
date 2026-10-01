import type { Config } from "tailwindcss";

// Tokens sourced directly from Design.md ("Basedash: Style Reference").
// Do not add warm grays or extra accent colors — see design doc "Do's and Don'ts".
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        "void-black": "#000000",
        "carbon-card": "#050607",
        "ghost-white": "#ffffff",
        "bone-white": "#e8eaee",
        "ash-gray": "#b3b3b3",
        "steel-gray": "#808080",
        graphite: "#333333",
        "lavender-pulse": "#9984d8",
        "mint-signal": "#3fcb7f",
        // Documented deviation #3: desaturated cool red, form errors only.
        "error-red": "#ff6b6b",
      },
      fontFamily: {
        // Documented deviation #1: real "Alpha Lyrae" / "Iowan Old Style" are
        // unavailable, so these tokens point at the closest free substitutes.
        // Swap the font-family value here (and the <link> in index.html) to
        // wire in the real fonts later — nothing else needs to change.
        "alpha-lyrae": ["var(--font-alpha-lyrae)"],
        "iowan-old-style": ["var(--font-iowan-old-style)"],
        inter: ["var(--font-inter)"],
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.5", letterSpacing: "-0.36px" }],
        "body-sm": ["14px", { lineHeight: "1.43", letterSpacing: "-0.42px" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "-0.48px" }],
        "body-lg": ["18px", { lineHeight: "1.56", letterSpacing: "-0.54px" }],
        subheading: ["24px", { lineHeight: "1.25", letterSpacing: "-0.6px" }],
        "heading-sm": ["30px", { lineHeight: "1.2", letterSpacing: "-0.9px" }],
        heading: ["34px", { lineHeight: "1.2", letterSpacing: "-1.02px" }],
        display: ["48px", { lineHeight: "1" }],
        // Documented deviation #2: sub-480px display step-down only.
        "display-mobile": ["40px", { lineHeight: "1" }],
      },
      spacing: {
        "4": "4px",
        "8": "8px",
        "12": "12px",
        "16": "16px",
        "20": "20px",
        "24": "24px",
        "28": "28px",
        "32": "32px",
        "40": "40px",
        "48": "48px",
        "56": "56px",
        "96": "96px",
        "128": "128px",
      },
      borderRadius: {
        card: "16px",
        badge: "999px",
        input: "6px",
        button: "6px",
      },
      maxWidth: {
        page: "1200px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-vertical": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "sheet-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "overlay-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "dialog-out": {
          from: { opacity: "1", transform: "translateY(0) scale(1)" },
          to: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "marquee-vertical": "marquee-vertical 20s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "sheet-in": "sheet-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "sheet-out": "sheet-out 240ms cubic-bezier(0.4, 0, 1, 1) both",
        "overlay-in": "overlay-in 300ms ease-out both",
        "overlay-out": "overlay-out 240ms ease-in both",
        "dialog-in": "dialog-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "dialog-out": "dialog-out 220ms cubic-bezier(0.4, 0, 1, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
