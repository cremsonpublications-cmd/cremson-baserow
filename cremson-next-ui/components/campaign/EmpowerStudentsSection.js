"use client";

import { useState } from "react";
import { Heart, Users, Award, BookOpen } from "lucide-react";

const ICON_MAP = { Heart, Users, Award, BookOpen };

function ImageWithFallback({ src, alt, className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[#E8EDF5] rounded-2xl ${className}`}>
        <Users size={64} className="text-[#0A1628]/30 mb-3" />
        <span className="text-sm text-[#0A1628]/40 font-medium text-center px-4">
          {alt || "Students Image"}
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

export default function EmpowerStudentsSection({ data }) {
  return (
    <section className="bg-white py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left: Content */}
        <div className="order-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4">
            {data.heading}
          </h2>
          <p className="text-gray-600 text-base leading-relaxed mb-8">
            {data.subtext}
          </p>
          <ul className="space-y-4">
            {data.benefits.map((benefit, i) => {
              const Icon = ICON_MAP[benefit.icon] || Heart;
              return (
                <li key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F5B800]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-[#0A1628]" />
                  </div>
                  <span className="font-semibold text-[#0A1628]">{benefit.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: Image */}
        <div className="order-2 flex justify-center">
          <div className="w-full max-w-sm">
            <ImageWithFallback
              src={data.image}
              alt={data.imageAlt}
              className="w-full h-64 sm:h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
