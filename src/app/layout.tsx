import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Local Dialect — Learn Kenyan Languages",
  description: "Master Kikuyu, Luo, Luhya and more with daily bite-sized lessons, audio pronunciation, and fun rewards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
