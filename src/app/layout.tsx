import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Life Tracker",
    template: "%s · Life Tracker",
  },
  description:
    "Personal habits, finance and notes hub — one calm, dark, fast home for your day.",
};

export const viewport: Viewport = {
  themeColor: "#010102",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-canvas text-ink min-h-full">
        <div className="flex min-h-screen">
          <AppNav />
          <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
