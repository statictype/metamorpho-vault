import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
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
      <body
        className={`${geistSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
