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

export const metadata: Metadata = {
  metadataBase: new URL("https://album-architect.vercel.app"),
  title: {
    default: "Album Architect — Fantasy Music Curation & A&R Draft",
    template: "%s · Album Architect",
  },
  description:
    "Draft your dream EP or LP across positional slots, dodge the Artist Monopoly penalty, and get reviewed by an AI A&R critic panel. Powered by YouTube Music, Spotify, and Web Audio.",
  keywords: [
    "music draft",
    "A&R game",
    "playlist curation",
    "album sequencing",
    "fantasy music league",
    "hip-hop draft",
    "music game",
  ],
  applicationName: "Album Architect",
  authors: [{ name: "Album Architect" }],
  openGraph: {
    type: "website",
    url: "https://album-architect.vercel.app",
    title: "Album Architect — Fantasy Music Curation & A&R Draft",
    description:
      "Draft your dream EP or LP, balance energy pacing, and get reviewed by an AI A&R critic panel.",
    siteName: "Album Architect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Album Architect — Fantasy Music Curation & A&R Draft",
    description:
      "Draft your dream EP or LP, balance energy pacing, and get reviewed by an AI A&R critic panel.",
  },
  icons: {
    icon: "/favicon.ico",
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
