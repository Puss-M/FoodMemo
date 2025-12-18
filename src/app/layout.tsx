import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AMapRegistry from '@/components/AMapRegistry';
import ChatProvider from '@/components/ChatProvider';
import IOSInstallPrompt from '@/components/IOSInstallPrompt';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fff7ed",
}

export const metadata: Metadata = {
  title: "FoodMemo - 只有真话的美食圈",
  description: "基于熟人信任链的高质量美食分享平台。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FoodMemo",
  },
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
      {/* PWA: Apple user-select fix to feel more like app? Optional */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground select-none`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AMapRegistry />
          <ChatProvider>
            {children}
          </ChatProvider>
          <IOSInstallPrompt />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
