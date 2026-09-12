import type { Metadata, Viewport } from "next";
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
  description: "How full is the bus you're about to take.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${editorialNew.variable} ${fraktionMono.variable}`}>
      <body>
        <FontCheck />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
