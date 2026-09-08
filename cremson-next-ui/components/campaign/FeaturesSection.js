import {
  CheckCircle,
  Star,
  Zap,
  Shield,
  Clock,
  BookOpen,
  Layers,
  PenTool,
  FileText,
  BarChart2,
  Repeat,
  Globe,
} from "lucide-react";

const ICON_MAP = {
  CheckCircle,
  Star,
  Zap,
  Shield,
  Clock,
  BookOpen,
  Layers,
  PenTool,
  FileText,
  BarChart2,
  Repeat,
  Globe,
};

function FeatureItem({ icon, title, description }) {
  const Icon = ICON_MAP[icon] || Star;
  return (
    <div className="flex gap-5 items-start">
      <div className="flex-shrink-0 w-12 h-12 bg-[#0A1628] rounded-2xl flex items-center justify-center">
        <Icon size={22} className="text-[#F5B800]" />
      </div>
      <div>
        <h3 className="font-bold text-[#0A1628] text-base mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function FeaturesSection({ heading, items }) {
  return (
    <section className="bg-white py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
          {items.map((item, i) => (
            <FeatureItem
              key={i}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
