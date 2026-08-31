import Link from "next/link";
import { Phone, Mail } from "lucide-react";

export default function CampaignFooter({ footer, brand }) {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-bold text-white text-base">{brand.name}</span>
          </div>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <a
              href={`tel:${footer.contact.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone size={15} />
              {footer.contact.phone}
            </a>
            <a
              href={`mailto:${footer.contact.email}`}
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail size={15} />
              {footer.contact.email}
            </a>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>{footer.copyright}</p>
          <div className="flex items-center gap-4">
            {footer.links.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
