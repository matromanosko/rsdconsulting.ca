import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/app/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${BRAND} — Power BI for wine agencies using ezFocus`,
  description:
    "Power BI reporting for wine agencies. We turn your ezFocus sales data into automated dashboards and supplier reports, and save your team hours of manual data work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
