"use client";

import { useState } from "react";
import api from "../../lib/api/axios";
import { toast } from "sonner";

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

  const [ticketId, setTicketId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/api/crm/support-tickets", {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        subject: "Contact Us Enquiry",
      });
      if (res.data?.ticket_id) {
        setTicketId(res.data.ticket_id);
      }
      setSubmitted(true);
      toast.success("Support ticket created! Check WhatsApp for confirmation.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <div className="text-xs text-gray-600 pt-1">Landline: <a href="tel:011-45785945" className="text-blue-600 hover:underline">011-45785945</a></div>
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
              Fill out the form below to email our support team directly.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-900">Support Request Received!</h3>
              {ticketId && (
                <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-mono font-bold rounded-full border border-green-200">
                  Ticket ID: {ticketId}
                </div>
              )}
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Thank you for reaching out! We have sent a WhatsApp confirmation to your phone. Our support team will review your enquiry and get back to you shortly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ fullName: "", phone: "", email: "", message: "" });
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
                    className="w-full pl-[70px] pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
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
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none border-gray-300"
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>{loading ? "Sending Message..." : "Send Message"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

