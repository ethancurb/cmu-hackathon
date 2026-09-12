import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        page: "var(--page)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-deep": "var(--ink-deep)",
        blue: "var(--blue)",
        lime: "var(--lime)",
        rule: "var(--rule)",
        border: "var(--border)",
        "border-soft": "var(--border-soft)",
        bar: "var(--bar)",
        "on-ink": "var(--on-ink)",
      },
      fontFamily: {
        /* Temporary fallback stack behind the real families — see app/font-check.ts.
           Remove the fallback entries once public/fonts holds the real woff2 files. */
        display: ["var(--font-display)", "Times New Roman", "Times", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontWeight: {
        regular: "var(--weight-regular)",
        bold: "var(--weight-bold)",
      },
      fontSize: {
        headline: ["var(--text-headline)", { lineHeight: "var(--leading-headline)" }],
        wordmark: ["var(--text-wordmark)", { lineHeight: "1" }],
        "emphasis-number": ["var(--text-emphasis-number)", { lineHeight: "var(--leading-mono)" }],
        "location-subhead": ["var(--text-location-subhead)", { lineHeight: "var(--leading-mono)" }],
        "row-title": ["var(--text-row-title)", { lineHeight: "var(--leading-mono)" }],
        body: ["var(--text-body)", { lineHeight: "var(--leading-mono)" }],
        descriptor: ["var(--text-descriptor)", { lineHeight: "var(--leading-mono)" }],
        "section-label": ["var(--text-section-label)", { lineHeight: "var(--leading-mono)" }],
        "nav-label": ["var(--text-nav-label)", { lineHeight: "var(--leading-mono)" }],
        "axis-label": ["var(--text-axis-label)", { lineHeight: "var(--leading-mono)" }],
        label: ["var(--text-label)", { lineHeight: "var(--leading-mono)" }],
        "button-label": ["var(--text-button-label)", { lineHeight: "var(--leading-mono)" }],
        "select-secondary": ["var(--text-select-secondary)", { lineHeight: "var(--leading-mono)" }],
        footnote: ["var(--text-footnote)", { lineHeight: "var(--leading-mono)" }],
      },
      letterSpacing: {
        loud: "var(--tracking-loud)",
      },
      opacity: {
        footnote: "var(--opacity-footnote)",
      },
      spacing: {
        gutter: "var(--gutter)",
        control: "var(--control-height)",
      },
      maxWidth: {
        content: "var(--content-width)",
      },
      width: {
        content: "var(--content-width)",
      },
      height: {
        control: "var(--control-height)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        bar: "var(--radius-bar)",
      },
    },
  },
  plugins: [],
};

export default config;
