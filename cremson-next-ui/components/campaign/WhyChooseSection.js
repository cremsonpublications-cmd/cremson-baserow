import {
  BookOpen,
  Lightbulb,
  Target,
  Users,
  School,
  Headphones,
  Heart,
  Award,
  GraduationCap,
  Building2,
  Dumbbell,
} from "lucide-react";

const ICON_MAP = {
  BookOpen,
  Lightbulb,
  Target,
  Users,
  School,
  Headphones,
  Heart,
  Award,
  GraduationCap,
  Building2,
  Dumbbell,
};

function FeatureCard({ icon, title, description }) {
  const Icon = ICON_MAP[icon] || BookOpen;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-start gap-3">
      <div className="w-12 h-12 bg-[#0A1628]/5 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon size={24} className="text-[#0A1628]" />
      </div>
      <div>
        <h3 className="font-bold text-[#0A1628] text-base mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function WhyChooseSection({ heading, items }) {
  return (
    <section className="bg-gray-50 py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <FeatureCard
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
