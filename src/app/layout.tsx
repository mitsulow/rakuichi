import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mplus = M_PLUS_Rounded_1c({
  variable: "--font-mplus",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c94d3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "楽市楽座 — ナチュラル、本物、自然派のお店と人",
  description:
    "みつろうさんとMMM23,000人が推薦する、全国の自然派のお店。お米、発酵食品、整体、占い、音楽…信用できる推薦で見つかります。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "楽市楽座",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${mplus.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
