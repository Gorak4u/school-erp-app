import SessionVerifier from "@/components/SessionVerifier";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SchoolConfigProvider } from "@/contexts/SchoolConfigContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SocketProvider } from "@/contexts/SocketContext";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Toast from "@/components/Toast";
import { TemplateInitializer } from "@/components/TemplateInitializer";
import CallNotifications from "@/components/CallNotifications";
import { CallProviderWrapper } from "@/components/CallProviderWrapper";

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
                    <CallNotifications />
                    {children}
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
