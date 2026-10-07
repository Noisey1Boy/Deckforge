import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Theme fonts are loaded once, globally, from Google Fonts (client-side).
 * Each design system references its families via its token stacks; if the
 * CDN is unreachable the stacks degrade gracefully to system fonts.
 */
const FONTS_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Inter:wght@400;500;600;700" +
  "&family=Inter+Tight:wght@600;700;800" +
  "&family=Space+Grotesk:wght@500;600;700" +
  "&family=Archivo+Black&family=Archivo:wght@400;500;600;700" +
  "&family=Big+Shoulders+Display:wght@600;700;800" +
  "&family=Baloo+2:wght@500;600;700&family=Nunito:wght@400;600;700;800" +
  "&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500" +
  "&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500" +
  "&family=Source+Sans+3:wght@400;600;700" +
  "&family=Sora:wght@400;600;700;800" +
  "&family=Fraunces:wght@500;600;700" +
  "&family=Work+Sans:wght@400;500;600;700" +
  "&family=IBM+Plex+Mono:wght@400;500;600" +
  // Theme-expansion families (M-b): serif numerals + editorial + terminal +
  // paper-collage display faces.
  "&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400" +
  "&family=Public+Sans:wght@400;500;600;700" +
  "&family=DM+Sans:wght@400;500;600;700" +
  "&family=Jost:wght@300;400;500;600" +
  "&family=JetBrains+Mono:wght@400;500;700" +
  "&family=Instrument+Serif:ital@0;1" +
  "&family=Shrikhand" +
  "&family=Zilla+Slab:ital,wght@0,400;0,500;0,600;0,700;1,400" +
  "&display=swap";

export const metadata: Metadata = {
  title: "DeckForge AI — Prompt to polished presentation",
  description:
    "Generate designed, on-brand presentations from a prompt or your own data. 8 curated design systems, live re-theming, charts, present mode and PPTX/PDF/HTML export.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_HREF} crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
