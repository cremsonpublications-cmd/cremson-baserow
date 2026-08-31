"use client";

import CampaignHeader from "./CampaignHeader";
import HeroSection from "./HeroSection";
import WhyChooseSection from "./WhyChooseSection";
import ProductSection from "./ProductSection";
import ComboOfferCard from "./ComboOfferCard";
import AudienceSection from "./AudienceSection";
import TestimonialsSection from "./TestimonialsSection";
import EmpowerStudentsSection from "./EmpowerStudentsSection";
import FinalCTA from "./FinalCTA";
import CampaignFooter from "./CampaignFooter";

export default function CampaignPage({ data }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <CampaignHeader brand={data.brand} />

      {data.hero?.visible && (
        <HeroSection data={data.hero} brand={data.brand} />
      )}

      {data.whyChoose?.visible && (
        <WhyChooseSection
          heading={data.whyChoose.heading}
          items={data.whyChoose.items}
        />
      )}

      {data.product?.visible && <ProductSection data={data.product} />}

      {data.comboOffer?.visible && <ComboOfferCard data={data.comboOffer} />}

      {data.audience?.visible && (
        <AudienceSection
          heading={data.audience.heading}
          items={data.audience.items}
        />
      )}

      {data.testimonials?.visible && (
        <TestimonialsSection
          heading={data.testimonials.heading}
          items={data.testimonials.items}
        />
      )}

      {data.empowerStudents?.visible && (
        <EmpowerStudentsSection data={data.empowerStudents} />
      )}

      {data.cta?.visible && <FinalCTA data={data.cta} />}

      <CampaignFooter footer={data.footer} brand={data.brand} />
    </div>
  );
}
