import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://obefree.com"),
  title: {
    default: "Obefree — Games, Gamification & Interactive Systems",
    template: "%s — Obefree",
  },
  description:
    "Independent studio building games, gamification systems, educational tools and experimental AI/VR experiences.",
  openGraph: {
    title: "Obefree",
    description:
      "Games, gamification, educational tools and experimental AI interfaces.",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
