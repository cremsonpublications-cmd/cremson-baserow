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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
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
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-12 border border-gray-200">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-3">Send Us a Message</h2>
            <p className="text-sm md:text-base text-gray-600">
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-900">Message Sent Successfully!</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Thank you for reaching out to Cremson Publications. Our team will get back to you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ fullName: "", phone: "", email: "", message: "" });
                }}
                className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
              >
                Send Another Message
              </button>
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="Enter your mobile number"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                  value={formData.phone}
                  onChange={handleChange}
                />
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md"
              >
                <span>{loading ? "Sending..." : "Send Message"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
