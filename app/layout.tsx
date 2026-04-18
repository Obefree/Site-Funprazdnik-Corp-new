import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://funprazdnik.corp"),
  title: {
    default: "Funprazdnik Corp — игровые события для распределённых команд",
    template: "%s — Funprazdnik Corp",
  },
  description:
    "Онлайн, оффлайн и гибридные форматы для команд: улучшаем связи, ускоряем онбординг и даём полезный сигнал о состоянии коллектива.",
  openGraph: {
    title: "Funprazdnik Corp",
    description:
      "Игровые события и продукты для распределённых команд. Experience → Dynamics → Signal.",
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="min-h-screen bg-surface text-ink antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Перейти к контенту
        </a>
        <Header />
        <main id="content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
