"use client";
import React, { useState } from 'react';

export default function SafeImage({ src, alt, className }: { src: string, alt: string, className: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      {/* সুন্দর জলছাপ (সবসময় ব্যাকগ্রাউন্ডে থাকবে) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] select-none">
        <span className="text-xl md:text-3xl font-extrabold text-gray-900 transform -rotate-12 whitespace-nowrap">বঙ্গীয় টাইমস</span>
      </div>
      
      {/* আসল ছবি (যদি ব্রোকেন না হয়, তবেই শো করবে) */}
      {src && !hasError && (
        <img 
          src={src} 
          alt={alt} 
          onError={() => setHasError(true)} 
          className="absolute inset-0 w-full h-full object-cover z-10" 
        />
      )}
    </div>
  );
}
