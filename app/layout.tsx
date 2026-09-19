import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./legal.css";
import "./portal.css";
import "./staff.css";
import { LegalFooter } from "@/components/LegalFooter";

const manrope = localFont({
  src: "../public/fonts/Manrope-Variable.ttf",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://lacaccino.vercel.app"),
  title: "LACACCINO — Ein Moment. Ganz deiner.",
  description:
    "LACACCINO — Kaffee to go, als Luxus gedacht. Entdecke eine neue Markenwelt aus Kaffee, Design und Genuss. Geplanter Markenstart 2029.",
  applicationName: "LACACCINO",
  openGraph: {
    title: "LACACCINO — Ein Moment. Ganz deiner.",
    description:
      "Kaffee to go, als Luxus gedacht. LACACCINO — geplanter Markenstart 2029.",
    type: "website",
    locale: "de_DE",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "LACACCINO — Ein Moment. Ganz deiner.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LACACCINO — Ein Moment. Ganz deiner.",
    description:
      "Kaffee to go, als Luxus gedacht. LACACCINO — geplanter Markenstart 2029.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={manrope.variable}>
      <body>
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
