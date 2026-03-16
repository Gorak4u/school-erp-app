import SessionVerifier from "@/components/SessionVerifier";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SchoolConfigProvider } from "@/contexts/SchoolConfigContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Toast from "@/components/Toast";

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
        <SessionProviderWrapper>
          <SessionVerifier />
          <ThemeProvider>
            <SchoolConfigProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </SchoolConfigProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
        <Toast theme="light" />
      </body>
    </html>
  );
}
