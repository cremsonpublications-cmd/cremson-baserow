import { Quote, Star } from "lucide-react";

function StarRating() {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className="text-[#F5B800] fill-[#F5B800]" />
      ))}
    </div>
  );
}

function TestimonialCard({ quote, name, role }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
      <Quote size={24} className="text-[#0A1628]/20" />
      <p className="text-gray-600 text-sm leading-relaxed flex-1 italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-1">
        <StarRating />
        <p className="font-bold text-[#0A1628] text-sm mt-1">{name}</p>
        <p className="text-gray-500 text-xs">{role}</p>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ heading, items }) {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <TestimonialCard
              key={i}
              quote={item.quote}
              name={item.name}
              role={item.role}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
