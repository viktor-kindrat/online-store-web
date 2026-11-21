import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SessionProvider } from "@/features/auth/session";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "M&H",
  description: "M&H — clothing store",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SessionProvider>
            <SiteHeader />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
              {children}
            </main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
