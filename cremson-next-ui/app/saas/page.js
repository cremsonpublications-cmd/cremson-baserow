import Link from "next/link";
import DemoRequestForm from "./DemoRequestForm";

export const metadata = {
  title: "Cremson Publications SaaS – E-Commerce Platform for Publishers",
  description:
    "A centralised platform to manage your branded bookstore, products, orders, shipping and customer notifications. Built for independent publishers in India.",
  keywords: [
    "publisher e-commerce platform",
    "book publisher SaaS",
    "India publisher software",
    "online bookstore management",
    "Amazon Flipkart marketplace integration",
    "Shipway shipping integration",
    "WhatsApp order notifications",
    "cremson publications saas",
  ],
  alternates: {
    canonical: "/saas",
  },
  openGraph: {
    title: "Cremson Publications SaaS – E-Commerce Platform for Publishers",
    description:
      "Manage your branded bookstore, products, orders, shipping and customer notifications from one platform built for publishers.",
    url: "https://cremsonpublications.com/saas",
    siteName: "Cremson Publications",
    images: [
      {
        url: "/poster.png",
        width: 1536,
        height: 1024,
        alt: "Cremson Publications SaaS Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cremson Publications SaaS – E-Commerce Platform for Publishers",
    description:
      "Manage your branded bookstore, products, orders, shipping and customer notifications from one platform.",
    images: ["/poster.png"],
  },
};

// ── Feature data ────────────────────────────────────────────────────────────

const features = [
  {
    title: "Branded Publisher Storefronts",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    description:
      "Each publisher gets a fully branded online bookstore served on their own custom domain. Your identity, your catalogue, your customers — on infrastructure we operate and maintain.",
  },
  {
    title: "Book & Inventory Management",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    description:
      "Add and update books, set pricing and discounts, manage categories, upload cover images, and track inventory levels — all from a central admin dashboard.",
  },
  {
    title: "Unified Order Management",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    description:
      "View, filter, and act on all your website orders in one place. Track order status from placement to fulfilment and maintain a clear operational record.",
  },
  {
    title: "Shipping & Tracking Automation",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-4m-4 0V5a2 2 0 00-2-2H8a2 2 0 00-2 2v2m4 0h4" />
      </svg>
    ),
    description:
      "Integrates with Shipway to initiate shipping bookings, receive tracking updates, and keep customers informed. Actual booking and courier availability depend on your Shipway account and supported pincodes.",
  },
  {
    title: "WhatsApp Business Notifications",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    description:
      "Send order confirmations and shipping updates to customers via WhatsApp using Meta's official Business API. Message delivery depends on template approval status and the customer's WhatsApp account.",
  },
  {
    title: "Marketplace Integrations",
    status: "planned",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    description:
      "Planned integration with Amazon and Flipkart to synchronise inventory and pull marketplace orders alongside your website orders. Under development — availability will depend on marketplace API authorisation.",
  },
  {
    title: "Reporting & Business Insights",
    status: "live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description:
      "View sales trends, order volumes, and product performance through a built-in dashboard. Identify your best-selling titles and understand customer behaviour over time.",
  },
  {
    title: "Optional Modules & Add-ons",
    status: "planned",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    description:
      "Planned paid modules include accounting integration with BUSY, advanced coupon management, bulk-order handling, and specimen/sample copy workflows. Exact availability and pricing to be confirmed.",
  },
];

const faqs = [
  {
    q: "Who can use Cremson Publications SaaS?",
    a: "The platform is intended for independent book publishers and educational content houses that want to operate an online bookstore and manage their order and shipping workflows centrally. Onboarding is currently handled case by case. Contact us to discuss your requirements.",
  },
  {
    q: "Can publishers keep their own domain?",
    a: "Yes. Publishers can operate their storefront on their own custom domain. Domain configuration requires standard DNS access and a brief setup process that our team will assist with.",
  },
  {
    q: "Can each publisher connect their own Amazon seller account?",
    a: "The planned Amazon integration uses Amazon's Selling Partner API (SP-API). Each publisher would need an active Amazon Seller Central account in the Indian marketplace and would need to authorise the platform to access their account through the SP-API authorisation flow. Cremson Publications is not affiliated with, endorsed by, or certified by Amazon. The integration is currently in development and is not yet available.",
  },
  {
    q: "Can website and marketplace orders be managed together?",
    a: "This is a planned capability. The intent is to show website orders and marketplace orders — such as Amazon and Flipkart — in a single dashboard view. This feature is not yet available and will depend on completing the marketplace integrations.",
  },
  {
    q: "How does WhatsApp integration work?",
    a: "The platform uses Meta's official WhatsApp Business API to send transactional messages — such as order confirmations and dispatch notifications — to customers. Message delivery depends on Meta's template approval process, the customer having an active WhatsApp account, and applicable messaging policy. The platform does not send unsolicited marketing messages.",
  },
  {
    q: "How does shipping integration work?",
    a: "The platform integrates with Shipway, a third-party shipping aggregator. When an order is marked for dispatch, the platform initiates a booking request through Shipway. Tracking updates are received and stored. Actual courier availability, pickup scheduling, and tracking details depend on your Shipway account, your contracted couriers, and serviceable pincodes. Shipway's own terms, fees, and limitations apply.",
  },
  {
    q: "Are third-party service charges included in the platform subscription?",
    a: "No. Third-party charges — such as Shipway courier fees, Razorpay payment processing fees, Meta WhatsApp messaging charges, and any marketplace selling fees — are separate from the platform subscription and are billed directly by those providers. Your subscription covers access to the platform itself.",
  },
  {
    q: "Can publishers add features after they sign up?",
    a: "Yes. Optional modules and add-ons are planned to allow publishers to activate additional capabilities as their business grows. Pricing for modules will be confirmed once they are ready for release.",
  },
  {
    q: "How can a publisher request a demo?",
    a: "Use the demo request form on this page or email us at info@cremsonpublications.com. Our team will arrange a walkthrough of the platform and discuss how it can be configured for your publishing operations.",
  },
];

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
      Coming Soon
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SaasPage() {
  return (
    <div className="bg-white text-gray-900">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full px-3 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now accepting publisher enquiries
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              One Platform to Manage Your Publishing Business
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-indigo-100 leading-relaxed max-w-2xl mb-8">
              Manage your online bookstore, products, orders, shipping workflows
              and customer notifications from one central platform built for
              publishers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-semibold rounded-lg px-6 py-3.5 text-sm shadow-lg hover:bg-indigo-50 transition-colors"
              >
                Request a Demo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold rounded-lg px-6 py-3.5 text-sm hover:bg-white/20 transition-colors"
              >
                Explore Features
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="overflow-hidden">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10 md:h-12 block">
            <path d="M0 48V24C360 0 720 48 1080 24S1440 0 1440 24V48H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Everything a Publisher Needs
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            A growing set of tools designed around how publishing businesses
            actually operate — from catalogue management to post-order
            communication.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <StatusBadge status={f.status} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-6">
          &ldquo;Available&rdquo; indicates a capability present in the current platform.
          &ldquo;Coming Soon&rdquo; indicates features under active development that are not
          yet released.
        </p>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Order-to-Delivery Workflow
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
              A straightforward flow from the moment a customer places an order
              to when their books arrive.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {[
              {
                step: "1",
                title: "Customer Places Order",
                desc: "A customer visits your branded storefront and completes checkout via Razorpay.",
                color: "bg-indigo-600",
              },
              {
                step: "2",
                title: "Order Recorded",
                desc: "The platform records the order details, payment status, and delivery address.",
                color: "bg-violet-600",
              },
              {
                step: "3",
                title: "Shipping Initiated",
                desc: "You confirm dispatch. The platform requests a shipment booking through Shipway, subject to your account configuration.",
                color: "bg-purple-600",
              },
              {
                step: "4",
                title: "Tracking Updated",
                desc: "Tracking information from the courier is received and stored in the order record.",
                color: "bg-pink-600",
              },
              {
                step: "5",
                title: "Customer Notified",
                desc: "Eligible WhatsApp notifications — such as order confirmation and dispatch alerts — are sent via Meta's Business API.",
                color: "bg-rose-600",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 ${item.color} text-white rounded-full flex items-center justify-center font-bold text-sm mb-3 flex-shrink-0`}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
                {i < 4 && (
                  <svg className="hidden lg:block w-6 h-6 text-gray-300 absolute" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto">
            Shipway bookings, courier pickups, tracking availability, and
            WhatsApp message delivery depend on the respective provider, your
            account configuration, and applicable service terms.
          </p>
        </div>
      </section>

      {/* ── Marketplace Integrations ──────────────────────────────────── */}
      <section id="integrations" className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-amber-200">
            In Development
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Marketplace Integrations
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            We are building integrations to help publishers view and manage
            Amazon and Flipkart marketplace orders alongside their website
            orders. These integrations are in development and are not yet
            available.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {[
            {
              name: "Amazon Seller Central",
              api: "Amazon SP-API",
              status: "In Development",
              description:
                "Planned integration using Amazon's Selling Partner API. Publishers would connect their own Amazon Seller Central account through the standard SP-API authorisation process. Each publisher is responsible for their own seller account, listing policies, and compliance with Amazon's terms of service.",
              note: "Cremson Publications is not affiliated with, endorsed by, or certified by Amazon. Seller account eligibility and API access are subject to Amazon's approval.",
            },
            {
              name: "Flipkart Seller Hub",
              api: "Flipkart Seller API",
              status: "In Development",
              description:
                "Planned integration to pull order data from Flipkart and synchronise inventory counts. Publishers would use their own Flipkart Seller Hub credentials. Access depends on Flipkart's API availability and applicable seller tier requirements.",
              note: "Cremson Publications is not affiliated with, endorsed by, or officially partnered with Flipkart. Seller account eligibility is subject to Flipkart's criteria.",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {m.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{m.api}</p>
                </div>
                <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                  {m.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {m.description}
              </p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Note:</strong> {m.note}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-8 max-w-2xl mx-auto">
          Amazon and Flipkart trademarks belong to their respective owners.
          Their inclusion here describes planned technical integrations using
          publicly available developer APIs, not any business partnership or
          endorsement.
        </p>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Pricing
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
              We are currently working with publishers directly to understand
              their requirements before publishing fixed subscription plans.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Contact Us for Pricing
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Pricing will depend on your publishing catalogue size, the
                modules you need, and your expected order volume. Request a demo
                and our team will prepare a proposal tailored to your
                requirements.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  What the subscription covers:
                </p>
                <ul className="space-y-1 text-xs text-gray-600">
                  {[
                    "Access to the publisher admin dashboard",
                    "Branded storefront on your custom domain",
                    "Product, order, and inventory management",
                    "Shipping integration via Shipway (account required)",
                    "WhatsApp order notifications via Meta Business API",
                    "Onboarding support from the Cremson team",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Third-party charges are not included
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Charges from Razorpay (payment processing), Shipway (courier
                  and logistics), Meta (WhatsApp messaging), and any
                  marketplace selling fees are billed directly by those
                  providers and are separate from the platform subscription.
                </p>
              </div>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-8 py-3.5 text-sm transition-colors shadow-sm"
              >
                Request a Quote
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
            Honest answers about what the platform does, what it does not yet
            do, and how third-party services fit in.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none font-semibold text-gray-900 text-sm hover:bg-gray-50 transition-colors">
                <span>{faq.q}</span>
                <svg
                  className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 pt-1">
                <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Demo Request ─────────────────────────────────────────────── */}
      <section id="demo" className="bg-gradient-to-br from-indigo-50 to-violet-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Left */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Request a Demo
              </h2>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6">
                Tell us about your publishing operation and we will arrange a
                walkthrough of the platform. There is no obligation — we want
                to understand your needs before discussing how we can help.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ),
                    label: "Phone / WhatsApp",
                    value: "+91 79826 45175",
                    href: "tel:+917982645175",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: "Email",
                    value: "info@cremsonpublications.com",
                    href: "mailto:info@cremsonpublications.com",
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    label: "Office Hours",
                    value: "Monday – Saturday, 10:00 AM – 6:00 PM IST",
                    href: null,
                  },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {c.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {c.label}
                      </p>
                      {c.href ? (
                        <a href={c.href} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {c.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-indigo-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  You can also visit the{" "}
                  <Link href="/contact-us" className="text-indigo-600 hover:underline">
                    Contact Us page
                  </Link>{" "}
                  for our full office address or to send a general support
                  query.
                </p>
              </div>
            </div>
            {/* Right: Form */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-5">
                Send us a demo request
              </h3>
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Legal / Policy links strip ───────────────────────────────── */}
      <div className="bg-gray-900 text-gray-400 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            &copy; {new Date().getFullYear()} Cremson Publications. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/contact-us" className="hover:text-white transition-colors">
              Contact / Support
            </Link>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
