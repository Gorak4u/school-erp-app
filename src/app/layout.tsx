import SessionVerifier from "@/components/SessionVerifier";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SocketProvider } from "@/contexts/SocketContext";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Toast from "@/components/Toast";
import { TemplateInitializer } from "@/components/TemplateInitializer";
import { SchoolConfigProvider } from "@/contexts/SchoolConfigContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { CallProviderWrapper } from "@/components/CallProviderWrapper";
import CallNotifications from "@/components/CallNotifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "School ERP - Management System",
  description: "Comprehensive School Management ERP Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "School ERP",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1976D2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <TemplateInitializer />
        <SessionProviderWrapper>
          <SessionVerifier />
          <ThemeProvider>
            <SchoolConfigProvider>
              <NotificationProvider>
                <SocketProvider>
                  <CallProviderWrapper>
                    <ProfileProvider>
                      <CallNotifications />
                      {children}
                    </ProfileProvider>
                  </CallProviderWrapper>
                </SocketProvider>
              </NotificationProvider>
            </SchoolConfigProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
        <Toast theme="light" />
      </body>
    </html>
  );
}
