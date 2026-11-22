import type { Metadata, Viewport } from "next";
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

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const metadata: Metadata = {
  ...(configuredSiteUrl ? { metadataBase: new URL(configuredSiteUrl) } : {}),
  title: {
    default: "First Week — Draft an album. Drop it. See how it sells.",
    template: "%s · First Week",
  },
  description:
    "Draft an album from real songs, drop it, and see your first-week sales. Beat your rival, climb the all-time ladder and challenge friends.",
  keywords: [
    "music draft",
    "A&R game",
    "playlist curation",
    "album sequencing",
    "fantasy music league",
    "hip-hop draft",
    "music game",
  ],
  applicationName: "First Week",
  authors: [{ name: "First Week" }],
  openGraph: {
    type: "website",
    url: "/",
    title: "First Week — Draft an album. Drop it. See how it sells.",
    description: "Draft an album, drop it, and see how many you sell in week one. Can your friends outsell you?",
    siteName: "First Week",
  },
  twitter: {
    card: "summary_large_image",
    title: "First Week — Draft an album. Drop it. See how it sells.",
    description: "Draft an album, drop it, and see how many you sell in week one. Can your friends outsell you?",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
