export default function ComboOfferCard({ data }) {
  return (
    <section id="combo" className="bg-gray-50 py-16 sm:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-10">
          {data.heading}
        </h2>

        <div className="bg-[#0A1628] rounded-2xl overflow-hidden shadow-xl">
          {/* Top accent bar */}
          <div className="bg-[#F5B800] py-2 px-6 text-center">
            <span className="text-[#0A1628] font-bold text-sm uppercase tracking-widest">
              {data.label}
            </span>
          </div>

          <div className="p-8 sm:p-10 text-center">
            <h3 className="text-white font-bold text-xl sm:text-2xl mb-6">
              {data.productName}
            </h3>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {data.badges.map((badge, i) => (
                <span
                  key={i}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    i === 0
                      ? "bg-[#F5B800] text-[#0A1628]"
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Pricing */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <span className="text-gray-400 line-through text-xl font-medium">
                {data.originalPrice}
              </span>
              <span className="text-[#F5B800] font-bold text-5xl sm:text-6xl">
                {data.offerPrice}
              </span>
            </div>

            {/* Saving badge */}
            <div className="inline-block bg-[#22C55E] text-white text-sm font-bold px-5 py-2 rounded-full mb-8">
              {data.saving}
            </div>

            {/* CTA */}
            <div>
              <a
                href={data.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#F5B800] text-[#0A1628] font-bold px-10 py-4 rounded-full hover:bg-yellow-400 transition-colors duration-200 text-lg w-full sm:w-auto"
              >
                {data.cta.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
