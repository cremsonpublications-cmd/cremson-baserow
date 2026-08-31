"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function CampaignHeader({ brand }) {
  const waHref = `https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(brand.whatsappText)}`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="font-bold text-[#0A1628] text-lg hidden sm:block">
            {brand.name}
          </span>
        </Link>

        {/* WhatsApp CTA */}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold px-4 py-2 rounded-full transition-colors duration-200 text-sm"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">WhatsApp Us</span>
          <span className="sm:hidden">Chat</span>
        </a>
      </div>
    </header>
  );
}
