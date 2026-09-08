"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

function PagePreviewCard({ image, caption, description }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="aspect-[4/3] bg-[#E8EDF5] flex items-center justify-center overflow-hidden">
        {!image || failed ? (
          <div className="flex flex-col items-center justify-center w-full h-full gap-2">
            <BookOpen size={36} className="text-[#0A1628]/20" />
            <span className="text-xs text-[#0A1628]/30 px-4 text-center">{caption}</span>
          </div>
        ) : (
          <img
            src={image}
            alt={caption}
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
            loading="lazy"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#0A1628] text-sm mb-1">{caption}</h3>
        {description && (
          <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

export default function InsideProductSection({ heading, items }) {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {items.map((item, i) => (
            <PagePreviewCard
              key={i}
              image={item.image}
              caption={item.caption}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
