import type { Metadata } from "next";
import { editorialNew, fraktionMono } from "./fonts";
import { FontCheck } from "./font-check";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoadLine",
  description: "How full is the bus you're about to take.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${editorialNew.variable} ${fraktionMono.variable}`}>
      <body>
        <FontCheck />
        {children}
      </body>
    </html>
  );
}
