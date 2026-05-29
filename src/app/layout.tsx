import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "@/components/Toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "GokilChat — Chat Biasa Tetap Bisa, Terstruktur Juga Ada.",
  description: "Aplikasi chat web gokil yang ngasih kebebasan buat lu komunikasi sesederhana atau seterstruktur yang lu butuhin. Privasi tanpa kompromi, tanpa intip-intip percakapan.",
  keywords: ["chat", "messaging", "grup", "komunikasi terstructured", "privasi", "produktivitas", "Indonesia"],
  authors: [{ name: "Dier" }],
  openGraph: {
    title: "GokilChat",
    description: "Ngobrol gokil, tanpa batas, desain premium buat lu yang gokil.",
    url: "/",
    siteName: "GokilChat",
    images: [
      {
        url: "/images/logo-light.png",
        width: 800,
        height: 800,
        alt: "GokilChat Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} antialiased font-sans dark h-full`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0f0a06" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var size = localStorage.getItem('gokilchat-font-size') || 'medium';
                var configs = {
                  small: { mobile: '13px', desktop: '15px' },
                  medium: { mobile: '14px', desktop: '16px' },
                  large: { mobile: '16px', desktop: '18px' }
                };
                var config = configs[size] || configs.medium;
                var style = document.createElement('style');
                style.id = 'gokilchat-root-font-size';
                style.innerHTML = 'html { font-size: ' + config.mobile + ' !important; } @media (min-width: 768px) { html { font-size: ' + config.desktop + ' !important; } }';
                document.head.appendChild(style);
              } catch (e) {}
            })();
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `
        }} />
      </head>
      <body className="h-full flex flex-col bg-primary text-text-primary">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
