import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";
import { CookieConsent } from "@/components/common/CookieConsent";

// Шрифты — подгружаются локально через next/font (без внешних CDN)
const inter = Inter({
    subsets: ["latin", "cyrillic"],
    variable: "--font-sans",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin", "cyrillic"],
    variable: "--font-heading",
    display: "swap",
});

// Глобальные метаданные — SEO по умолчанию
export const metadata: Metadata = {
    title: {
        default: "Трикотажия — Интернет-магазин тканей",
        template: "%s | Трикотажия",
    },
    description:
        "Широкий ассортимент трикотажных тканей. Доставка по всей России.",
    keywords: [
        "ткани",
        "купить ткань",
        "хлопок",
        "шёлк",
        "интернет-магазин тканей",
        "трикотаж",
        "ткани оптом",
        "Футер",
        "Капитоний",
        "Кашкорсе",
        "Пике",
        "Рибана",
        "Интерлок",
        "Купоны с принтом",
        "Трикотажная вязка",
        "Термополотно",
        "Джерси",
        "Фурнитура"
    ],
    openGraph: {
        type: "website",
        locale: "ru_RU",
        siteName: "Трикотажия",
    },
    robots: {
        index: true,
        follow: true,
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ),
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" className={`${inter.variable} ${playfair.variable}`}>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="theme-color" content="#43C7CA" />
            </head>
            <body className="flex min-h-screen flex-col font-sans">
                <Providers>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                    <CookieConsent />
                </Providers>
            </body>
        </html>
    );
}
