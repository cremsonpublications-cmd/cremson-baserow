"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api/axios";
import {
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  Check,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const STEPS = ["Select Books", "Your Details", "Confirm"];

function BookCard({ book, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(book)}
      className={`relative group text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer w-full ${
        selected
          ? "border-red-500 bg-red-50/40 shadow-md shadow-red-100"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Selection tick */}
      <div
        className={`absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? "bg-red-500 border-red-500" : "bg-white border-gray-300 group-hover:border-red-400"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>

      {/* Book cover */}
      {book.main_image ? (
        <img
          src={book.main_image}
          alt={book.name}
          className="w-full h-40 object-cover object-top"
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-red-300" />
        </div>
      )}

      <div className="p-3">
        <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{book.name}</p>
        {book.classes && (
          <span className="mt-1 inline-block text-[10px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
            Class {book.classes}
          </span>
        )}
        {book.author && (
          <p className="mt-1 text-[10px] text-gray-400 truncate">{book.author}</p>
        )}
      </div>
    </button>
  );
}

export default function Specimen() {
  const [step, setStep] = useState(0); // 0=books, 1=details, 2=confirm/done
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    schoolName: "",
    address: "",
    designation: "Teacher",
    comments: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const { data: specimenConfig } = useQuery({
    queryKey: ["specimen-eligible-ids"],
    queryFn: async () => {
      const { data } = await api.get("/api/specimen-books/");
      return data;
    },
    staleTime: 60 * 1000,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["specimen-products"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const eligibleIds = new Set(specimenConfig?.product_ids ?? []);
  const allProductsList = (productsData?.results ?? []).filter((p) => p.name);
  // If admin has configured eligible books, show only those; otherwise show all active products
  const products = eligibleIds.size > 0
    ? allProductsList.filter((p) => eligibleIds.has(p.id))
    : allProductsList.filter((p) => p.is_active !== false);

  function toggleBook(book) {
    setSelectedBooks((prev) =>
      prev.some((b) => b.id === book.id)
        ? prev.filter((b) => b.id !== book.id)
        : [...prev, book]
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const booksRequested = selectedBooks.map((b) => b.name).join(", ");
      const notes = [
        `Name: ${formData.fullName}`,
        `School: ${formData.schoolName}`,
        `Designation: ${formData.designation}`,
        `Email: ${formData.email}`,
        `Mobile: ${formData.mobile}`,
        formData.comments ? `Note: ${formData.comments}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      await api.post("/api/specimen-requests/", {
        BooksRequested: booksRequested,
        Full_Address: formData.address,
        "Feedback/Notes": notes,
        RequestDate: new Date().toISOString().split("T")[0],
        DeliveryStatus: "Not dispatched",
        HandDeliveredBy: formData.fullName,
      });

      setSubmitted(true);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Step indicator
  const StepBar = () => (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                i < step
                  ? "bg-red-500 border-red-500 text-white"
                  : i === step
                  ? "bg-white border-red-500 text-red-600"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${i === step ? "text-red-600" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-1 ${i < step ? "bg-red-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Step 0: Book Selection ──────────────────────────────────
  if (step === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 w-full text-left">
        <div className="text-center mb-8">
          <span className="text-red-500 font-extrabold text-xs uppercase tracking-widest block mb-2">
            For Teachers &amp; Schools
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight mb-3">
            Request A Specimen Copy
          </h1>
          <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
            Select the books you&apos;d like to evaluate, then fill in your details to submit your specimen request.
          </p>
        </div>

        <StepBar />

        {loadingProducts ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span className="text-sm font-medium">Loading books...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  selected={selectedBooks.some((b) => b.id === book.id)}
                  onToggle={toggleBook}
                />
              ))}
            </div>

            {/* Fixed bottom bar */}
            <div className="sticky bottom-0 mt-8 py-4 bg-white/90 backdrop-blur border-t border-gray-100 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {selectedBooks.length === 0 ? (
                  <span className="text-gray-400">No books selected yet</span>
                ) : (
                  <span className="font-semibold text-gray-800">
                    <span className="text-red-600 font-bold">{selectedBooks.length}</span>{" "}
                    book{selectedBooks.length > 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={selectedBooks.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Step 1: Contact Details ────────────────────────────────
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 w-full text-left">
        <div className="text-center mb-8">
          <span className="text-red-500 font-extrabold text-xs uppercase tracking-widest block mb-2">
            For Teachers &amp; Schools
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 uppercase tracking-tight mb-3">
            Request A Specimen Copy
          </h1>
        </div>

        <StepBar />

        {/* Selected books summary */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Selected Books ({selectedBooks.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedBooks.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-200 text-red-700 text-xs font-semibold rounded-full"
              >
                {b.name}
                <button
                  type="button"
                  onClick={() => toggleBook(b)}
                  className="text-red-400 hover:text-red-700 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
          >
            ← Change selection
          </button>
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
                  id="fullName" type="text" name="fullName" required
                  value={formData.fullName} onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
              {/* School Name */}
              <div>
                <label htmlFor="schoolName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  School / Institution *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    id="schoolName" type="text" name="schoolName" required
                    value={formData.schoolName} onChange={handleChange}
                    placeholder="Enter school name"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    id="email" type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
              {/* Mobile */}
              <div>
                <label htmlFor="mobile" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    id="mobile" type="tel" name="mobile" required
                    value={formData.mobile} onChange={handleChange}
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
                  Designation *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <select
                    id="designation" name="designation"
                    value={formData.designation} onChange={handleChange}
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
              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Full Address
                </label>
                <input
                  id="address" type="text" name="address"
                  value={formData.address} onChange={handleChange}
                  placeholder="Street, City, State, PIN"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Additional Notes
              </label>
              <textarea
                id="comments" name="comments" rows={3}
                value={formData.comments} onChange={handleChange}
                placeholder="Number of students, any other requirements..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold text-sm rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <>Submit Request</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Step 2: Success ────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h1 className="text-2xl font-extrabold text-gray-900">Request Submitted!</h1>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          Your specimen request for <strong>{selectedBooks.length} book{selectedBooks.length > 1 ? "s" : ""}</strong> has been received.
          Our team will review it and contact you shortly.
        </p>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 w-full text-left mt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Books Requested</p>
          <ul className="space-y-1">
            {selectedBooks.map((b) => (
              <li key={b.id} className="text-sm font-semibold text-gray-800 flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {b.name}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => { setStep(0); setSelectedBooks([]); setFormData({ fullName: "", email: "", mobile: "", schoolName: "", address: "", designation: "Teacher", comments: "" }); setSubmitted(false); }}
          className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow transition-all cursor-pointer"
        >
          Request Another Specimen
        </button>
      </div>
    </div>
  );
}
