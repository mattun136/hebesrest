import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const siteUrl = "https://hebesu-brand.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "へべす | 宮崎県産 高級へべすブランド",
    template: "%s | へべす",
  },
  description:
    "宮崎県が誇る香酸柑橘「へべす」。豊かな香りと爽やかな酸味、栄養価の高さを未来へつなぐ生産者直送のブランドサイト。",
  keywords: [
    "へべす",
    "宮崎県",
    "柑橘",
    "香酸柑橘",
    "産地直送",
    "高級フルーツ",
  ],
  openGraph: {
    title: "へべす | 宮崎県産 高級へべすブランド",
    description: "へべすの価値を、未来へ。宮崎県産の香酸柑橘「へべす」をお届けします。",
    url: siteUrl,
    siteName: "へべす",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "へべす | 宮崎県産 高級へべすブランド",
    description: "へべすの価値を、未来へ。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${notoSerifJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
