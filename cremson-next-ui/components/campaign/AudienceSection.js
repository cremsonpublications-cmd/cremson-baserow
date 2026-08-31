import {
  GraduationCap,
  Building2,
  Dumbbell,
  Users,
  BookOpen,
} from "lucide-react";

const ICON_MAP = {
  GraduationCap,
  Building2,
  Dumbbell,
  Users,
  BookOpen,
};

function AudienceCard({ icon, title }) {
  const Icon = ICON_MAP[icon] || Users;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 bg-[#F5B800]/10 rounded-2xl flex items-center justify-center">
        <Icon size={28} className="text-[#0A1628]" />
      </div>
      <h3 className="font-bold text-[#0A1628] text-base leading-tight">{title}</h3>
    </div>
  );
}

export default function AudienceSection({ heading, items }) {
  return (
    <section className="bg-white py-16 sm:py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] text-center mb-12">
          {heading}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {items.map((item, i) => (
            <AudienceCard key={i} icon={item.icon} title={item.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
