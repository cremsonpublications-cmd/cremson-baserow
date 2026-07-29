import React from "react";
import { BookOpen, Award, Users, ShieldCheck } from "lucide-react";

export default function AboutUs() {
  const values = [
    {
      icon: <BookOpen className="h-6 w-6 text-red-600" />,
      title: "Academic Excellence",
      description: "Our textbooks are written by experienced educators and subject experts, ensuring precise alignment with curriculum standards."
    },
    {
      icon: <Award className="h-6 w-6 text-red-600" />,
      title: "Quality Printing & Materials",
      description: "We use top-grade paper and modern binding technology to ensure durability for heavy classroom use."
    },
    {
      icon: <Users className="h-6 w-6 text-red-600" />,
      title: "Student Centric Content",
      description: "Complex concepts are broken down using visual illustrations, real-world examples, and step-by-step practical guides."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-red-600" />,
      title: "Trusted by Educators",
      description: "Over thousands of schools across India trust Cremson Publications for secondary and senior secondary education."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 w-full text-left space-y-16">
      {/* Intro Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-red-500 font-extrabold text-xs sm:text-sm uppercase tracking-widest block">
            About Cremson Publications
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-tight leading-tight">
            Inspiring Minds through Quality Education
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
            Established with a vision to revolutionize learning materials, Cremson Publications has grown into a leading educational publisher in India. We specialize in producing comprehensive textbooks, lab manuals, and sample papers that build fundamental understanding and help students excel.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
            Our publications strictly adhere to national educational guidelines and board frameworks. By blending theoretical depth with practical application, we support teachers in delivering impactful classrooms.
          </p>
        </div>
        <div className="bg-red-50 rounded-3xl p-8 border border-red-100/50 flex items-center justify-center aspect-video sm:aspect-square lg:aspect-auto lg:h-[400px] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 via-orange-600/5 to-transparent z-0" />
          <div className="relative z-10 text-center space-y-4 max-w-sm">
            <span className="text-5xl font-black text-red-600">10+</span>
            <h3 className="font-extrabold text-lg text-gray-900 uppercase tracking-wider">Years of Dedication</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Consistently serving schools, educators, and millions of students with premium textbooks and syllabus resources.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="space-y-8">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-tight">
            Our Core Pillars
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Everything we do at Cremson Publications is guided by our commitment to delivering superior scholastic resources.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-gray-100 hover:border-red-500/20 p-6 hover:shadow-2xl transition-all flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                {val.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base mb-2">{val.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed font-medium">{val.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100/50 space-y-4">
          <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-wider">Our Mission</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
            To empower students with clear, conceptual, and interactive learning tools that make education engaging and practical. We strive to provide teachers with resourceful classroom materials that foster creativity and critical thinking.
          </p>
        </div>
        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100/50 space-y-4">
          <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-wider">Our Vision</h3>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
            To be recognized globally as the most trusted publisher for school curricula, continuously innovating with digital materials, companion resources, and smart educational content that adapts to the evolving educational ecosystem.
          </p>
        </div>
      </section>
    </div>
  );
}
