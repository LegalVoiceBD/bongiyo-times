import type { Metadata } from "next";
import { Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "বঙ্গীয় টাইমস - সত্য ও সাহসের প্রতিচ্ছবি",
  description: "বাংলাদেশের শীর্ষস্থানীয় ডিজিটাল নিউজ পোর্টাল",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        {/* Google AdSense Meta Verification (Instant Verification) */}
        <meta name="google-adsense-account" content="ca-pub-6625131155258287" />
        
        {/* Google AdSense Auto Ads Script */}
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6625131155258287" 
          crossOrigin="anonymous" 
          strategy="afterInteractive"
        />
      </head>
      <body className={`${notoSerifBengali.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
