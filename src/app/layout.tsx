import type { Metadata, Viewport } from "next";
import { Carlito } from "next/font/google";
import "./globals.css";

const carlito = Carlito({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-carlito", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Visualiseur de cuisine | BP Cuisines",
  description:
    "Prenez votre pièce en photo et voyez instantanément une cuisine BP Cuisines installée chez vous, en haute définition.",
  icons: { icon: "/icon-bpc.png", apple: "/icon-bpc.png" },
  openGraph: { title: "Visualiseur de cuisine BP Cuisines", images: ["/demo/apres-graphite-chaleureux.jpg"], locale: "fr_CH" },
};

export const viewport: Viewport = { themeColor: "#faf7f2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CH" className={carlito.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
