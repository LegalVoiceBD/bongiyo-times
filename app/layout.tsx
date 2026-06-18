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
  // ফেভিকন যুক্ত করা হয়েছে
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Ccircle cx='256' cy='256' r='240' fill='%23ffffff' /%3E%3Ccircle cx='256' cy='256' r='180' fill='none' stroke='%23dc2626' stroke-width='48' /%3E%3Ccircle cx='256' cy='256' r='32' fill='%23dc2626' /%3E%3Cline x1='256' y1='256' x2='256' y2='120' stroke='%23dc2626' stroke-width='36' stroke-linecap='round' /%3E%3Cline x1='256' y1='256' x2='330' y2='182' stroke='%23dc2626' stroke-width='36' stroke-linecap='round' /%3E%3C/svg%3E",
  },
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
