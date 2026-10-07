import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Base URL — update this to your production domain
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://decksmith.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Decksmith — AI HTML to Presentation Generator",
    template: "%s · Decksmith",
  },
  description:
    "Turn any text into a polished HTML presentation. 57 templates across 5 frameworks (open-design, reveal.js, impress.js, shower, dzslides). AI writes each slide concurrently. Free, no signup. Export to PPTX, PDF, or HTML.",
  keywords: [
    "AI presentation generator",
    "HTML presentation",
    "pitch deck maker",
    "PPTX generator",
    "AI slides",
    "reveal.js presentation",
    "presentation templates",
  ],
  authors: [{ name: "Decksmith" }],
  creator: "Decksmith",
  publisher: "Decksmith",
  applicationName: "Decksmith",
  category: "Productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Decksmith",
    title: "Decksmith — AI HTML to Presentation Generator",
    description:
      "Turn any text into a polished HTML presentation. 57 templates, 5 frameworks, AI-generated slides. Free, no signup.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Decksmith — AI HTML to Presentation Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Decksmith — AI HTML to Presentation Generator",
    description:
      "Turn any text into a polished HTML presentation. 57 templates, 5 frameworks, AI-generated slides. Free, no signup.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SEARCH_CONSOLE_ID || "",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#17171c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${BASE_URL}/#webapp`,
        name: "Decksmith",
        url: BASE_URL,
        description:
          "AI HTML to Presentation Generator. Turn any text into a polished HTML presentation with 57 templates across 5 frameworks.",
        applicationCategory: "ProductivityApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "57 presentation templates",
          "5 presentation frameworks (open-design, reveal.js, impress.js, shower, dzslides)",
          "3-stage concurrent AI pipeline",
          "PPTX, PDF, and HTML export",
          "Presentation mode with speaker notes",
          "Free AI models (DeepSeek V4 Flash, Z.AI)",
        ],
        publisher: { "@id": `${BASE_URL}/#org` },
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#org`,
        name: "Decksmith",
        url: BASE_URL,
        logo: `${BASE_URL}/logo.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: "Decksmith",
        publisher: { "@id": `${BASE_URL}/#org` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          suppressHydrationWarning
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          fontFamily: "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        suppressHydrationWarning
      >
        <div suppressHydrationWarning>
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}
