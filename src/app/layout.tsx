import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Icebreak — AI Cold Email Personalizer",
  description: "Paste a company URL + your offer. Get a personalized cold email in 10 seconds. Free for 5/day.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Icebreak",
  },
  openGraph: {
    title: "Icebreak — Personalized cold emails in 10 seconds",
    description: "Clay charges $495/month. We don't. Paste a URL, get a hyper-personalized cold email instantly.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Icebreak — Personalized cold emails in 10 seconds",
    description: "Clay charges $495/month. We don't.",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
      </body>
    </html>
  );
}
