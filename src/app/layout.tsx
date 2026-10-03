import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/context/QueryProvider";
import { DemoModeProvider } from "@/context/DemoModeContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { WalletProvider } from "@/context/WalletContext";
import { MobileContainer } from "@/components/layout/MobileContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexora Wallet | World App Mini App",
  description:
    "A sleek, mobile-first Web3 wallet for the World App ecosystem to manage tokens and digital collectibles.",
  applicationName: "Nexora Wallet",
  keywords: ["World App", "World Chain", "Mini App", "Web3", "Wallet", "NFT", "WLD"],
  authors: [{ name: "Nexora Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0B0E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#06070A] text-slate-100 flex flex-col">
        <QueryProvider>
          <DemoModeProvider>
            <NetworkProvider>
              <WalletProvider>
                <MobileContainer>{children}</MobileContainer>
              </WalletProvider>
            </NetworkProvider>
          </DemoModeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
