import localFont from "next/font/local";

export const editorialNew = localFont({
  src: "../public/fonts/PPEditorialNew-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-display",
  display: "swap",
});

export const fraktionMono = localFont({
  src: [
    {
      path: "../public/fonts/PPFraktionMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/PPFraktionMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});
