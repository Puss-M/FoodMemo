import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AMapRegistry from '@/components/AMapRegistry';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodMemo - 只有真话的美食圈",
  description: "基于熟人信任链的高质量美食分享平台。",
  openGraph: {
    title: "FoodMemo - 只有真话的美食圈",
    description: "基于熟人信任链的高质量美食分享平台。",
    url: "https://foodmemo.gofintech.cn",
    siteName: "FoodMemo",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50`}
      >
        <AMapRegistry />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
