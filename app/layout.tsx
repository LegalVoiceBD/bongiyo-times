import type { Metadata } from "next";
import { Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

// ক্লাসিক নিউজপেপার ফন্ট লোড করা হচ্ছে
const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "বঙ্গীয় টাইমস - সত্য ও সাহসের প্রতিচ্ছবি",
  description: "বাংলাদেশের শীর্ষস্থানীয় ডিজিটাল নিউজ পোর্টাল",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={`${notoSerifBengali.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
