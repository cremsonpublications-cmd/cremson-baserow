"use client";

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Mail, Phone, BookOpen, GraduationCap, Building2 } from "lucide-react";

export default function Specimen() {
  const { allProducts } = useApp();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    schoolName: "",
    designation: "Teacher",
    selectedBook: "",
    comments: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [formStatus, setFormStatus] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus("Request submitted! Our representative will contact you soon.");
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      schoolName: "",
      designation: "Teacher",
      selectedBook: "",
      comments: ""
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 w-full text-left">
      <div className="text-center mb-10">
        <span className="text-red-500 font-extrabold text-xs sm:text-sm uppercase tracking-widest block mb-2 animate-pulse">
          For Teachers &amp; Schools
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight mb-3">
          Request A Specimen Copy
        </h1>
        <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          Are you a teacher or school representative looking to evaluate our educational materials? Complete the form below to request a complimentary specimen book.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* School Name */}
            <div>
              <label htmlFor="schoolName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                School/Institution Name *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  id="schoolName"
                  type="text"
                  name="schoolName"
                  required
                  value={formData.schoolName}
                  onChange={handleChange}
                  placeholder="Enter school name"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* Mobile Contact */}
            <div>
              <label htmlFor="mobile" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Mobile/Contact Number *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Designation */}
            <div>
              <label htmlFor="designation" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Your Designation *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full pl-11 pr-8 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Teacher">Teacher / Faculty</option>
                  <option value="Principal">Principal / HOD</option>
                  <option value="Trustee">Trustee / Owner</option>
                  <option value="Manager">School Manager</option>
                  <option value="Other">Other Representative</option>
                </select>
              </div>
            </div>

            {/* Select Book */}
            <div>
              <label htmlFor="selectedBook" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Select Book For Specimen *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <BookOpen className="h-4 w-4" />
                </span>
                <select
                  id="selectedBook"
                  name="selectedBook"
                  value={formData.selectedBook}
                  onChange={handleChange}
                  className="w-full pl-11 pr-8 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Select a book --</option>
                  {allProducts.map((book) => (
                    <option key={book.id} value={book.title}>
                      {book.class ? `Class ${book.class} - ` : ""}{book.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comments / Requirements */}
          <div>
            <label htmlFor="comments" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Additional Requirements / Message
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={4}
              value={formData.comments}
              onChange={handleChange}
              placeholder="Tell us about the number of students or any other specific books you'd like to review..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            />
          </div>

          {/* Submit button */}
          {formStatus && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {formStatus}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-red-500/20 active:scale-98 transition-all"
          >
            Submit Specimen Request
          </button>
        </form>
      </div>
    </div>
  );
}
