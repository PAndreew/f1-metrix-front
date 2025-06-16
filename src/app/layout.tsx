import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header"; // 1. Import the Header component (adjust path if needed)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

export const metadata: Metadata = {
  title: "F1 Metrix", // You might want to update the title
  description: "Formula 1 statistics and analysis", // And description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`} lang="en">
      <body>
        <Header />
        <main>{children}</main> {/* It's good practice to wrap children in a <main> tag */}
      </body>
    </html>
  );
}