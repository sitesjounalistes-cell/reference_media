import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/reference/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "REFERENCE.COM — Le portail de référence",
  description:
    "Comprendre le monde, article par article. Sciences, histoire, technologie, santé, culture, société, économie et nature : des dossiers rigoureux, clairs et sourcés.",
  keywords: [
    "référence",
    "encyclopédie",
    "sciences",
    "histoire",
    "technologie",
    "santé",
    "culture",
    "société",
    "économie",
    "nature",
    "dossiers",
  ],
  authors: [{ name: "REFERENCE.COM" }],
  openGraph: {
    title: "REFERENCE.COM — Le portail de référence",
    description:
      "Comprendre le monde, article par article. Des dossiers rigoureux, clairs et sourcés.",
    siteName: "REFERENCE.COM",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "REFERENCE.COM — Le portail de référence",
    description:
      "Comprendre le monde, article par article. Des dossiers rigoureux, clairs et sourcés.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${playfair.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
