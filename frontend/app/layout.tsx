import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GrowEasy CSV Importer — AI-Powered CRM Lead Extraction",
  description:
    "Upload any CSV file and let AI intelligently map your data to GrowEasy CRM fields. Supports Facebook Ads, Google Ads, Excel sheets, and any custom CSV format.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-mesh min-h-screen">{children}</body>
    </html>
  );
}
