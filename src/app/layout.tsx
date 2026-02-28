import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppProvider";

/**
 * Global font configuration using Google Inter.
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * Metadata for the Focus Flow application.
 * Defines PWA capabilities and SEO descriptions.
 */
export const metadata: Metadata = {
  title: "Focus Flow",
  description: "Biometric-aware productivity system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Focus Flow",
  },
};

/**
 * Viewport configuration for mobile responsiveness.
 */
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * The Root Layout of the Next.js application.
 * It wraps the entire application in the `AppProvider` context hierarchy
 * and applies global styling and fonts.
 *
 * @param children - The active page content.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
