import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const editorial = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-normal.woff2",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
});
const body = localFont({
  src: "../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "200 800",
  display: "swap",
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
    <html lang="de" className={`${editorial.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
