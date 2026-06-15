"use client";
import React, { useState } from 'react';

export default function SafeImage({ src, alt, className }: { src: string, alt: string, className: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      {/* চমৎকার জলছাপ */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] select-none">
        <span className="text-xl md:text-3xl font-extrabold text-gray-900 transform -rotate-12 whitespace-nowrap">বঙ্গীয় টাইমস</span>
      </div>
      
      {/* আসল ছবি (যদি ব্রোকেন হয়, সাথে সাথে হাইড হয়ে যাবে) */}
      {src && !hasError && (
        <img 
          src={src} 
          alt={alt} 
          onError={(e) => {
            setHasError(true);
            e.currentTarget.style.display = 'none'; // ব্রোকেন আইকন জোর করে বন্ধ করা হলো
          }} 
          className="absolute inset-0 w-full h-full object-cover z-10" 
        />
      )}
    </div>
  );
}
