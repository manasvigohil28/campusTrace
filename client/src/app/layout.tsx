import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
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
  title: "CampusTrace — AI-Powered Lost & Found for College Campuses",
  description:
    "Lost something on campus? CampusTrace uses smart AI matching to reconnect students with their belongings. Fast, secure, and community-driven.",
  keywords: [
    "lost and found",
    "campus",
    "college",
    "AI matching",
    "CampusTrace",
  ],
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
      <body className="min-h-full flex flex-col bg-ct-bg-deep text-ct-text-primary noise">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

