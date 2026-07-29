import React from "react";

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 w-full text-left space-y-8">
      <div>
        <span className="text-red-500 font-extrabold text-xs sm:text-sm uppercase tracking-widest block mb-2">
          Legal Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Last Updated: July 2026</p>
      </div>

      <div className="prose prose-red text-sm text-gray-600 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Cremson Publications website, online storefront, or placing an order, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">2. Product Specifications &amp; Pricing</h2>
          <p>
            We attempt to describe all educational textbooks, lab manuals, and sample papers as accurately as possible. However, we do not warrant that product descriptions or other content are error-free. Prices for all products are subject to change without notice. All listed prices include applicable local taxes unless specified otherwise.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">3. Order Placement &amp; Delivery</h2>
          <p>
            All orders placed through the website are subject to availability and acceptance. Once an order is confirmed, we will dispatch the books to the registered shipping address within the stated timeframe. While we make every effort to deliver on time, we are not liable for delays caused by shipping carriers or custom clearances.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">4. Returns &amp; Cancellation Policy</h2>
          <p>
            Complimentary specimen copies sent to schools/teachers are strictly not for resale. Purchases made through our store are eligible for returns within 7 days of delivery only if the product is defective, damaged in transit, or the incorrect title was shipped. The product must remain in unused condition.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">5. Intellectual Property Rights</h2>
          <p>
            All content on this website, including book covers, illustrations, logos, copy, digital assets, and code, is the property of Cremson Publications and protected by copyright laws. Unauthorized reproduction, modification, distribution, or resale is strictly prohibited.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">6. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of Delhi, India. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Delhi.
          </p>
        </section>
      </div>
    </div>
  );
}
