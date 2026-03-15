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
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Focus Flow",
  description: "Biometric-aware productivity system",
  manifest: `${basePath}/manifest.json`,
  other: {
    "content-security-policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.firebaseio.com https://apis.google.com https://www.gstatic.com; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
      "img-src 'self' data: https://*.googleusercontent.com https://upload.wikimedia.org https://www.gstatic.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "frame-src 'self' https://*.firebaseapp.com https://*.google.com; " +
      "object-src 'none';"
  },
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
