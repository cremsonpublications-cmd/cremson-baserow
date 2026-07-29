"use client";

import { useState } from "react";
import { MapPin, Phone, Smartphone, Mail, Clock } from "lucide-react";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: ""
  });
  const [formStatus, setFormStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus("Message sent! Our support desk will reach out within 24 hours.");
    setFormData({ fullName: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 w-full text-left">
      <div className="text-center mb-12">
        <span className="text-red-500 font-extrabold text-xs sm:text-sm uppercase tracking-widest block mb-2">
          Get In Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight">
          Contact Our Helpdesk
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mt-2">
          Have queries about orders, partnerships, or bulk pricing? Fill out the contact form or reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        {/* Contact Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-10 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-extrabold text-lg text-gray-900 uppercase tracking-wider mb-2">
              Send Us A Message
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Query Subject"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Message / Detail
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
            </div>

            {formStatus && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                {formStatus}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-red-500/20 active:scale-98 transition-all"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info Cards & Map */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-4">
            <h3 className="font-extrabold text-lg text-gray-900 uppercase tracking-wider">
              Quick Details
            </h3>

            <div className="space-y-3.5">
              <div className="flex gap-3 text-sm">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-gray-600">
                  4578/15, Ansari Road, Opp. Happy School, Daryaganj, New Delhi, Delhi, 110002
                </span>
              </div>

              <div className="flex gap-3 text-sm">
                <Phone className="h-5 w-5 text-red-500 flex-shrink-0" />
                <a href="tel:011-4578594" className="text-red-600 hover:underline font-bold">
                  011-4578594
                </a>
              </div>

              <div className="flex gap-3 text-sm">
                <Smartphone className="h-5 w-5 text-red-500 flex-shrink-0" />
                <a href="tel:+917982645175" className="text-red-600 hover:underline font-bold">
                  +91 7982645175
                </a>
              </div>

              <div className="flex gap-3 text-sm">
                <Mail className="h-5 w-5 text-red-500 flex-shrink-0" />
                <a href="mailto:info@cremsonpublications.com" className="text-red-600 hover:underline font-bold break-all">
                  info@cremsonpublications.com
                </a>
              </div>

              <div className="flex gap-3 text-sm">
                <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-gray-600 font-medium">
                  Mon - Sat, 09:00 AM - 06:00 PM
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden h-[250px] lg:flex-1 border border-gray-100/50 relative">
            <iframe
              title="Cremson Publications Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.674920656613!2d77.243199!3d28.6489313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfdb930b05529%3A0xc91931c5625f55a3!2sCremson%20Publications%204578%2F15%2C%20Ansari%20Rd%20opp.%20Happy%20School%2C%20Daryaganj%20New%20Delhi%2C%20Delhi%2C%20110002!5e0!3m2!1sen!2sin!4v1750450282497!5m2!1sen!2sin"
              className="w-full h-full border-none absolute inset-0"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
