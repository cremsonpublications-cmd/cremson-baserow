"use client";

import { useState } from "react";
import { CheckCircle, BookOpen } from "lucide-react";

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#E8EDF5] rounded-2xl ${className}`}>
        <BookOpen size={64} className="text-[#0A1628]/30 mb-3" />
        <span className="text-sm text-[#0A1628]/40 font-medium text-center px-4">
          {alt || "Book Image"}
        </span>
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

export default function ProductSection({ data }) {
  return (
    <section id="product" className="bg-white py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left: Details */}
        <div className="order-1">
          <span className="inline-block bg-[#0A1628] text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            {data.classLabel}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4">
            {data.title}
          </h2>
          <p className="text-gray-600 text-base leading-relaxed mb-8">
            {data.description}
          </p>

          <ul className="space-y-3 mb-8">
            {data.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <CheckCircle size={20} className="text-[#22C55E] flex-shrink-0" />
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>

          <a
            href={data.cta.href}
            className="inline-flex items-center justify-center bg-[#F5B800] text-[#0A1628] font-bold px-7 py-3.5 rounded-full hover:bg-yellow-400 transition-colors duration-200 text-base"
          >
            {data.cta.label}
          </a>
        </div>

        {/* Right: Book image */}
        <div className="order-2 flex justify-center">
          <div className="w-full max-w-xs">
            <ImageWithFallback
              src={data.image}
              alt={data.imageAlt}
              className="w-full h-auto object-contain rounded-2xl drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
