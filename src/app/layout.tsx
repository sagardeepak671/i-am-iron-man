import type { Metadata } from "next";
// Same Geist Sans / Geist Mono families as before, but bundled from the `geist`
// package (already a dependency) instead of fetched from Google Fonts at build
// time. The CSS variables (--font-geist-sans / --font-geist-mono) are unchanged.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// Geist Pixel (also bundled in the `geist` package) is used only by the
// companion's retro J.A.R.V.I.S. terminal / quiz HUD.
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { StarkCompanion } from "@/components/companion/StarkCompanion";

const geistSans = GeistSans;
const geistMono = GeistMono;
const geistPixel = GeistPixelSquare;

export const metadata: Metadata = {
  title: {
    default: "Stark Industries — Mark LXXXV",
    template: "%s",
  },
  description:
    "Arc reactor online. F.R.I.D.A.Y. standing by. Scroll to engage the Mark LXXXV.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${geistPixel.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-background text-foreground grain">
        <SmoothScrollProvider>
          {children}
          {/* Retro pixel Iron Man pet + J.A.R.V.I.S. terminal, on every route. */}
          <StarkCompanion />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
