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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"),
  title: {
    default: "TrackDraft — Fantasy Music Curation & A&R Game",
    template: "%s · TrackDraft",
  },
  description:
    "Draft seven-song projects, EPs, and albums across positional slots, then get a transparent A&R scorecard and critique.",
  keywords: [
    "music draft",
    "A&R game",
    "playlist curation",
    "album sequencing",
    "fantasy music league",
    "hip-hop draft",
    "music game",
  ],
  applicationName: "TrackDraft",
  authors: [{ name: "TrackDraft" }],
  openGraph: {
    type: "website",
    url: "/",
    title: "TrackDraft — Fantasy Music Curation & A&R Game",
    description: "Draft your dream project, balance energy pacing, and receive an explainable A&R scorecard.",
    siteName: "TrackDraft",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackDraft — Fantasy Music Curation & A&R Game",
    description: "Draft your dream project, balance energy pacing, and receive an explainable A&R scorecard.",
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
