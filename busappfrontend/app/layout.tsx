import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { editorialNew, fraktionMono } from "./fonts";
import { FontCheck } from "./font-check";
import { AppProvider } from "@/lib/app-context";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "LoadLine",
  description: "Predictive Transit Pressure for Pittsburgh: what transit will be like when you go, why, and when to leave.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${editorialNew.variable} ${fraktionMono.variable}`}>
      <body>
        <FontCheck />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
