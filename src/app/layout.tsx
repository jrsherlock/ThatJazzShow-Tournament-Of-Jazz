import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Tournament of Jazz | That Jazz Show on KRUI 89.7 FM",
  description:
    "Fill out your bracket, pick your champions, and compete in the annual Tournament of Jazz — presented by That Jazz Show on 89.7 KRUI-FM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[#0A0A0A] text-zinc-100 noise-overlay`}
      >
        {children}
      </body>
    </html>
  );
}
