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
