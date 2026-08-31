export default function FinalCTA({ data }) {
  return (
    <section className="bg-[#0A1628] py-16 sm:py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
          {data.heading}
        </h2>
        <p className="text-gray-300 text-base sm:text-lg mb-10 leading-relaxed">
          {data.subtext}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={data.primaryBtn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#F5B800] text-[#0A1628] font-bold px-10 py-4 rounded-full hover:bg-yellow-400 transition-colors duration-200 text-base"
          >
            {data.primaryBtn.label}
          </a>
          <a
            href={data.secondaryBtn.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-white text-white font-semibold px-10 py-4 rounded-full hover:bg-white hover:text-[#0A1628] transition-colors duration-200 text-base"
          >
            {data.secondaryBtn.label}
          </a>
        </div>
      </div>
    </section>
  );
}
