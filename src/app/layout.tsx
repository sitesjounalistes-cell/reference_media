import type { Metadata } from "next";
import {
  Archivo,
  Geist,
  Geist_Mono,
  Lora,
  Montserrat,
  Oswald,
  Playfair_Display,
  Poppins,
} from "next/font/google";
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

/* Polices éditoriales supplémentaires proposées dans le cockpit
   (sélecteur de police par champ : titre, chapô, corps d'article). */
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Referencemedia.info — Le portail de référence",
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
  authors: [{ name: "Referencemedia.info" }],
  openGraph: {
    title: "Referencemedia.info — Le portail de référence",
    description:
      "Comprendre le monde, article par article. Des dossiers rigoureux, clairs et sourcés.",
    siteName: "Referencemedia.info",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Referencemedia.info — Le portail de référence",
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
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${playfair.variable} ${lora.variable} ${poppins.variable} ${montserrat.variable} ${oswald.variable} antialiased bg-background text-foreground`}
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
