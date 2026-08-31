"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import Link from "next/link";

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#E8EDF5] rounded-2xl ${className}`}>
        <BookOpen size={64} className="text-[#0A1628]/30 mb-3" />
        <span className="text-sm text-[#0A1628]/40 font-medium">{alt || "Book Image"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function HeroSection({ data, brand }) {
  return (
    <section className="bg-[#0A1628] text-white py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left: Text content */}
        <div className="order-1">
          <div className="inline-block bg-[#F5B800] text-[#0A1628] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
            Cremson Publications
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
            {data.headline.split(". ").map((part, i, arr) => (
              <span key={i}>
                {i === 0 ? (
                  <span>
                    {part}
                    {arr.length > 1 ? "." : ""}
                  </span>
                ) : (
                  <span className="text-[#F5B800]"> {part}</span>
                )}
              </span>
            ))}
          </h1>

          <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
            {data.subtext}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={data.primaryCta.href}
              className="inline-flex items-center justify-center bg-[#F5B800] text-[#0A1628] font-bold px-7 py-3.5 rounded-full hover:bg-yellow-400 transition-colors duration-200 text-base"
            >
              {data.primaryCta.label}
            </a>
            <a
              href={data.secondaryCta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border-2 border-white text-white font-semibold px-7 py-3.5 rounded-full hover:bg-white hover:text-[#0A1628] transition-colors duration-200 text-base"
            >
              {data.secondaryCta.label}
            </a>
          </div>
        </div>

        {/* Right: Book image */}
        <div className="order-2 flex justify-center">
          <div className="w-full max-w-sm">
            <ImageWithFallback
              src={data.image}
              alt={data.imageAlt}
              className="w-full h-auto object-contain rounded-2xl drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
