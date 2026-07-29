import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 w-full text-left space-y-8">
      <div>
        <span className="text-red-500 font-extrabold text-xs sm:text-sm uppercase tracking-widest block mb-2">
          Data Protection
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Last Updated: July 2026</p>
      </div>

      <div className="prose prose-red text-sm text-gray-600 leading-relaxed space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">1. Information We Collect</h2>
          <p>
            When you purchase books, request a specimen copy, subscribe to our newsletter, or fill out a contact form, we collect personal details such as your name, email, telephone number, and school/shipping address.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">2. How We Use Your Information</h2>
          <p>
            We use the collected information to process order deliveries, communicate tracking details, dispatch specimen copies, send periodic discount newsletter offers (which you can opt-out of at any time), and answer support requests.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">3. Information Protection &amp; Security</h2>
          <p>
            We implement comprehensive technical and organizational security measures to prevent unauthorized access, alteration, disclosure, or destruction of your personal data. We do not sell or trade customer details to third-party marketing companies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">4. Cookies and Analytics</h2>
          <p>
            We use essential cookies to maintain cart states and provide smooth site navigation. We also utilize analytical services to track site performance and identify loading speed or checkout bottlenecks, ensuring an optimized user experience.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">5. Customer Rights</h2>
          <p>
            You have the right to request access to the personal data we store about you, update incorrect details, or request full deletion of your contact records from our servers. Please email our privacy desk to submit a request.
          </p>
        </section>
      </div>
    </div>
  );
}
