import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
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
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "LACACCINO — Ein Moment. Ganz deiner." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LACACCINO — Ein Moment. Ganz deiner.",
    description:
      "Kaffee to go, als Luxus gedacht. LACACCINO — geplanter Markenstart 2029.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
