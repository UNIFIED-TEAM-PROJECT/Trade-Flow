import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tradesflow.co.uk"),
  title: "TradesFlow",
  description: "Field service operating system for modern trades businesses.",
  applicationName: "TradesFlow",
  icons: {
    icon: [
      {
        url: "/branding/tradesflow_svg_bundle/tradesflow-icon-only.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/branding/tradesflow_svg_bundle/tradesflow-app-icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
