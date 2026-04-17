import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "MetaMorpho Vault — 3F x Steakhouse USDC",
  description: "Deposit and withdraw USDC from the 3F x Steakhouse MetaMorpho vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://blue-api.morpho.org"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://eth-mainnet.g.alchemy.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://api.web3modal.org"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
