import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const aeonik = localFont({
  src: [
    { path: "../fonts/AeonikPro-Light.otf", weight: "300", style: "normal" },
    { path: "../fonts/AeonikPro-Regular.otf", weight: "400", style: "normal" },
    { path: "../fonts/AeonikPro-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/AeonikPro-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-aeonik",
  display: "swap",
});

const dotMatrix = localFont({
  src: "../fonts/DotMatrixTwo.ttf",
  variable: "--font-dot-matrix",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Arcium Explorer",
    template: "%s | Arcium Explorer",
  },
  description:
    "Explore the Arcium MPC network — confidential computations, clusters, ARX nodes, and execution environments on Solana.",
  keywords: ["Arcium", "MPC", "Solana", "Explorer", "Confidential Computing"],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${aeonik.variable} ${dotMatrix.variable} antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Suspense>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
