import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/app/lib/brand";
import { getLang } from "@/app/lib/i18n/server";
import { dict } from "@/app/lib/i18n/dictionaries";
import { LangProvider } from "@/app/lib/i18n/LangProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = dict(await getLang());
  return {
    title: `${BRAND} — ${t.meta.title}`,
    description: t.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
