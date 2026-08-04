"use client";

import { useState } from "react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "phone") {
      val = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      alert("Phone number must be exactly 10 digits.");
      return;
    }
    setLoading(true);

    const text = `Hello Cremson Publications 👋,

I have a query from your website:

👤 *Name*: ${formData.fullName}
📞 *Phone*: ${formData.phone}
✉️ *Email*: ${formData.email}

📝 *Message*:
${formData.message}`;

    const whatsappUrl = `https://wa.me/917982645175?text=${encodeURIComponent(text)}`;

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank");
      }
    }, 300);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-left">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 xl:px-0 text-center">
          <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4">Contact Us</h1>
          <p className="text-sm md:text-xl text-blue-100 max-w-2xl mx-auto">
            We're here to help you with all your educational needs. Get in touch with us today!
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Call / WhatsApp Us</h3>
            <p className="text-xs text-gray-500 mb-3">Mon - Sat: 9:00 AM - 6:00 PM</p>
            <div className="space-y-1 text-sm font-medium text-blue-600">
              <div><a href="tel:+917982645175" className="hover:underline">+91 79826 45175</a></div>
              <div><a href="tel:+919871757937" className="hover:underline">+91 98717 57937</a></div>
              <div><a href="tel:+918585937875" className="hover:underline">+91 85859 37875</a></div>
              <div className="text-xs text-gray-600 pt-1">Landline: <a href="tel:011-4578594" className="text-blue-600 hover:underline">011-4578594</a></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Email Support</h3>
            <p className="text-xs text-gray-500 mb-3">Drop us a line anytime</p>
            <a href="mailto:info@cremsonpublications.com" className="text-sm font-medium text-indigo-600 hover:underline">
              info@cremsonpublications.com
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Visit Our Office</h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mt-1">
              4578/15 (Basement), Aggarwal Road, Opp. Happy School, Darya Ganj, New Delhi – 110002
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-12 border border-gray-200 max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">Send Us a Message</h2>
            <p className="text-sm md:text-base text-gray-600">
              Fill out the form below to chat directly with our team on WhatsApp
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-900">Redirecting to WhatsApp!</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                WhatsApp is opening with your formatted message. If it didn't open automatically, click the button below.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Hello Cremson Publications 👋,

I have a query from your website:

👤 *Name*: ${formData.fullName}
📞 *Phone*: ${formData.phone}
✉️ *Email*: ${formData.email}

📝 *Message*:
${formData.message}`;
                    window.open(`https://wa.me/917982645175?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Open WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: "", phone: "", email: "", message: "" });
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-xs md:text-sm font-semibold mb-1 md:mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Enter your full name"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-xs md:text-sm font-semibold mb-1 md:mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-semibold pointer-events-none border-r border-gray-200 pr-2">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="w-full pl-[70px] pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-xs md:text-sm font-semibold mb-1 md:mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-xs md:text-sm font-semibold mb-1 md:mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  placeholder="Type your message here..."
                  rows={5}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none border-gray-300"
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"></path>
                </svg>
                <span>{loading ? "Preparing WhatsApp..." : "Send Message on WhatsApp"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

