"use client";

import { useState } from "react";
import api from "../../lib/api/axios";
import { toast } from "sonner";

export default function DemoRequestForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    publishingHouse: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/crm/support-tickets", {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        message: `[SaaS Demo Request]\nPublishing House: ${formData.publishingHouse || "Not specified"}\n\n${formData.message}`,
        subject: "SaaS Platform Demo Request",
      });
      setSubmitted(true);
      toast.success("Demo request received! We will contact you shortly.");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.detail ||
          "Failed to send your request. Please try again or email us directly."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 bg-green-50 border border-green-200 rounded-2xl text-center space-y-3 max-w-xl mx-auto">
        <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900">Request Received!</h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Thank you for your interest in Cremson Publications SaaS. Our team
          will review your request and reach out within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setFormData({
              fullName: "",
              phone: "",
              email: "",
              publishingHouse: "",
              message: "",
            });
          }}
          className="mt-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      <div>
        <label className="block text-gray-700 text-sm font-semibold mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          required
          placeholder="Your full name"
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={formData.fullName}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-semibold mb-1.5">
          Publishing House / Organisation
        </label>
        <input
          type="text"
          name="publishingHouse"
          placeholder="Name of your publishing house or organisation"
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={formData.publishingHouse}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-semibold mb-1.5">
          Phone Number <span className="text-red-500">*</span>
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
            className="w-full pl-[70px] pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-semibold mb-1.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="your@email.com"
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <label className="block text-gray-700 text-sm font-semibold mb-1.5">
          Tell us about your requirements
        </label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Briefly describe your publishing operations, the features you need, or any questions you have."
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          value={formData.message}
          onChange={handleChange}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-sm"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Sending…
          </>
        ) : (
          "Request a Demo"
        )}
      </button>
      <p className="text-xs text-center text-gray-500">
        By submitting this form you agree to our{" "}
        <a href="/privacy-policy" className="underline hover:text-indigo-600">
          Privacy Policy
        </a>
        . We will only use your details to respond to your enquiry.
      </p>
    </form>
  );
}
