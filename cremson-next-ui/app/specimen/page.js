"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api/axios";
import { useApp } from "../../context/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
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
  AlertTriangle,
  Lock,
  Upload,
  MapPin,
} from "lucide-react";

const STEPS = ["Select Books", "Your Details", "Confirm"];

const statesList = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

function TeacherAuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Teacher Verification Required</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-6">
          Specimen copies are free evaluation materials exclusively for verified school teachers &amp; educators. Please sign in with an approved teacher account or complete Teacher Registration to select specimen books.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/teacher-signup"
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <GraduationCap className="w-4 h-4" /> Register as Teacher →
          </Link>
          <Link
            href="/auth/signin?redirect=/specimen"
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            Sign In with Existing Account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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

function SpecimenContent() {
  const { user, setUser, authLogout } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasIdCard = Boolean(user?.id_card_url);

  const [selectedBooks, setSelectedBooks] = useState([]);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    mobile: user?.phone || "",
    schoolName: user?.school_name || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    designation: user?.designation || "Teacher",
    comments: "",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [idCardError, setIdCardError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedBooks, setSubmittedBooks] = useState([]);
  const [error, setError] = useState("");

  // Read step from URL — ONLY if books are selected or request was submitted, otherwise ALWAYS default to step 0 (First Page)
  const stepParam = searchParams.get("step");
  let step = 0;
  if (selectedBooks.length > 0 || submitted) {
    if (stepParam === "2") {
      step = 1;
    } else if (stepParam === "3") {
      step = 2;
    }
  }

  // Silently clean step URL param if visiting specimen page fresh with no selected books
  useEffect(() => {
    if (selectedBooks.length === 0 && !submitted && searchParams.has("step")) {
      const params = new URLSearchParams(window.location.search);
      params.delete("step");
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [selectedBooks.length, submitted, searchParams]);

  // Update step by routing
  const setStep = (newStep) => {
    const params = new URLSearchParams(window.location.search);
    if (newStep === 0) {
      params.delete("step");
    } else {
      params.set("step", String(newStep + 1));
    }
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const isApprovedTeacher = user && (user.role === "teacher" || user.is_admin);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        mobile: user.phone || "",
        schoolName: user.school_name || "",
        designation: user.designation || "Teacher",
        address: prev.address || "",
        city: prev.city || "",
        state: prev.state || "",
        pincode: prev.pincode || "",
      }));
    }
  }, [user]);

  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  useEffect(() => {
    if (formData.pincode && formData.pincode.length === 6) {
      const fetchPincodeDetails = async () => {
        setIsPincodeLoading(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success") {
            const postOffices = data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              const po = postOffices[0];
              const rawCity = po.District || po.Circle || po.Region || "";
              const rawState = po.State || "";

              // Clean city name using the metro mapping
              const p = formData.pincode.replace(/\D/g, "").trim();
              const c = String(rawCity || "").toLowerCase().trim();
              let cleanedCity = rawCity;
              if (p.startsWith("11") || c.includes("delhi")) cleanedCity = "Delhi";
              else if (p.startsWith("400") || c.includes("mumbai")) cleanedCity = "Mumbai";
              else if (p.startsWith("560") || c.includes("bangalore") || c.includes("bengaluru")) cleanedCity = "Bengaluru";
              else if (p.startsWith("600") || c.includes("chennai") || c.includes("madras")) cleanedCity = "Chennai";
              else if (p.startsWith("500") || c.includes("hyderabad") || c.includes("secunderabad")) cleanedCity = "Hyderabad";
              else if (p.startsWith("700") || c.includes("kolkata") || c.includes("calcutta")) cleanedCity = "Kolkata";
              else if (p.startsWith("411") || p.startsWith("412") || c.includes("pune")) cleanedCity = "Pune";
              else if (p.startsWith("380") || c.includes("ahmedabad")) cleanedCity = "Ahmedabad";

              // Update city and state in formData
              setFormData((prev) => {
                const updated = { ...prev, city: cleanedCity };
                const matchedState = statesList.find(
                  (st) => st.toLowerCase() === rawState.toLowerCase()
                );
                if (matchedState) {
                  updated.state = matchedState;
                } else if (rawState) {
                  updated.state = rawState;
                }
                return updated;
              });
            }
          }
        } catch (e) {
          console.error("Failed to look up pincode", e);
        } finally {
          setIsPincodeLoading(false);
        }
      };
      fetchPincodeDetails();
    }
  }, [formData.pincode]);

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
  const products = eligibleIds.size > 0
    ? allProductsList.filter((p) => eligibleIds.has(p.id))
    : allProductsList.filter((p) => p.is_active !== false);

  function toggleBook(book) {
    if (!isApprovedTeacher) {
      setShowAuthModal(true);
      return;
    }
    const isCurrentlySelected = selectedBooks.some((b) => b.id === book.id);
    setError("");
    setSelectedBooks((prev) =>
      isCurrentlySelected
        ? prev.filter((b) => b.id !== book.id)
        : [...prev, book]
    );
  }

  const handleContinue = () => {
    if (!isApprovedTeacher) {
      setShowAuthModal(true);
      return;
    }
    if (!hasIdCard) {
      setShowIdCardModal(true);
      return;
    }
    setStep(1);
  };

  async function handleIdCardUpload(file) {
    if (!file) return;
    setUploadingIdCard(true);
    setIdCardError("");
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("upload_preset", "unsigned_preset");

      const res = await fetch("https://api.cloudinary.com/v1_1/dkxxa3xt0/image/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      await api.post("/api/auth/update-id-card", { id_card_url: data.secure_url });
      
      if (setUser) {
        setUser((prev) => ({ ...prev, id_card_url: data.secure_url }));
      }
      setShowIdCardModal(false);
      setStep(1);
    } catch (err) {
      setIdCardError(err?.response?.data?.detail || err?.message || "Failed to upload ID Card photo. Please try again.");
    } finally {
      setUploadingIdCard(false);
    }
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
      const fullAddr = [
        (formData.address || "").trim(),
        (formData.city || "").trim(),
        (formData.state || "").trim() ? `${(formData.state || "").trim()} - ${(formData.pincode || "").trim()}` : (formData.pincode || "").trim()
      ].filter(Boolean).join(", ");

      const payload = {
        BooksRequested: booksRequested,
        Full_Address: fullAddr,
        "Feedback/Notes": formData.comments || "",
        RequestDate: new Date().toISOString().split("T")[0],
        DeliveryStatus: "Not dispatched",
        HandDeliveredBy: "",
      };
      if (formData.pincode) {
        const pinInt = parseInt(formData.pincode.trim(), 10);
        if (!isNaN(pinInt)) {
          payload.PinCode = pinInt;
        }
      }
      await api.post("/api/specimen-requests/", payload);

      setSubmittedBooks([...selectedBooks]);
      setSubmitted(true);

      const params = new URLSearchParams(window.location.search);
      params.set("step", "3");
      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
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

  // ── Step 2 / Submitted: Success Screen ────────────────────
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Request Submitted!</h1>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            Your specimen request for <strong>{submittedBooks.length} book{submittedBooks.length > 1 ? "s" : ""}</strong> has been received.
            Our team will review it and contact you shortly.
          </p>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 w-full text-left mt-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Books Requested</p>
            <ul className="space-y-1">
              {submittedBooks.map((b) => (
                <li key={b.id || b.name} className="text-sm font-semibold text-gray-800 flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {b.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setSubmittedBooks([]);
                setSelectedBooks([]);
                setFormData((prev) => ({
                  ...prev,
                  address: user?.residence || user?.full_address || user?.address || "",
                  comments: "",
                }));
                const params = new URLSearchParams(window.location.search);
                params.delete("step");
                router.push(`${window.location.pathname}`);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow transition-all cursor-pointer"
            >
              Submit Another Request
            </button>
            <Link
              href="/"
              onClick={() => {
                setSubmitted(false);
                setSubmittedBooks([]);
                setSelectedBooks([]);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Teacher restriction warning banner */}
        {!isApprovedTeacher && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {user && user.role === "teacher"
                    ? "Teacher Verification Pending"
                    : user
                    ? "Student or Customer Account Detected"
                    : "Verified Teacher Access Required"}
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  {!user
                    ? "Specimen copy requests are exclusively available for verified school teachers. Please sign in or register as a teacher."
                    : user.role === "teacher"
                    ? "Welcome! Please select the specimen copies you would like to receive."
                    : "You are currently logged in as a student/customer. Free specimen copies are only available for verified teachers. Please log out and sign in with a teacher account, or register a new teacher account."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              {!user ? (
                <>
                  <Link
                    href="/auth/signin?redirect=/specimen"
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs rounded-xl transition-all text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/teacher-signup"
                    className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition-all text-center"
                  >
                    Teacher Sign Up →
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={authLogout}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow transition-all text-center cursor-pointer"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        )}

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
                onClick={handleContinue}
                disabled={selectedBooks.length === 0 || !isApprovedTeacher}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title={!isApprovedTeacher ? "Teacher approval required to continue" : ""}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <TeacherAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

        {showIdCardModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">ID Card Required</h3>
              <p className="text-xs text-gray-600 leading-relaxed mb-6">
                To request specimen copies, please upload a photo of your Teacher ID Card or School ID. This is a one-time verification.
              </p>

              {idCardError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {idCardError}
                </div>
              )}

              <label className="block w-full cursor-pointer">
                <div className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-red-500 rounded-2xl bg-gray-50 flex flex-col items-center justify-center transition-all mb-4">
                  {uploadingIdCard ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Loader2 className="w-5 h-5 animate-spin text-red-600" /> Uploading ID Card...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs font-bold text-red-600">Click to Select ID Card Photo</span>
                      <span className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG or WEBP</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingIdCard}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleIdCardUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                disabled={uploadingIdCard}
                onClick={() => setShowIdCardModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
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
                  disabled={true}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-sm focus:outline-none transition-all"
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
                    disabled={true}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-sm focus:outline-none transition-all"
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
                    disabled={true}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-sm focus:outline-none transition-all"
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
                    disabled={true}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-sm focus:outline-none transition-all"
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
                    disabled={true}
                    className="w-full pl-11 pr-8 py-3 rounded-2xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-sm focus:outline-none transition-all appearance-none"
                  >
                    <option value="Teacher">Teacher / Faculty</option>
                    <option value="Principal">Principal / HOD</option>
                    <option value="Trustee">Trustee / Owner</option>
                    <option value="Manager">School Manager</option>
                    <option value="Other">Other Representative</option>
                  </select>
                </div>
              </div>
              {/* Pincode */}
              <div>
                <label htmlFor="pincode" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Pincode *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    id="pincode" type="text" name="pincode" required
                    value={formData.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setFormData((prev) => ({ ...prev, pincode: val }));
                    }}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  {isPincodeLoading && (
                    <div className="absolute right-3.5 top-3.5">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Town / City */}
              <div>
                <label htmlFor="city" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Town / City *
                </label>
                <input
                  id="city" type="text" name="city" required
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Town / City"
                  readOnly={formData.pincode && formData.pincode.length === 6 && formData.city !== ""}
                  className={`w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all ${
                    formData.pincode && formData.pincode.length === 6 && formData.city !== ""
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-gray-50/50 text-black"
                  }`}
                />
              </div>
              {/* State */}
              <div>
                <label htmlFor="state" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  State *
                </label>
                <div className="relative">
                  <select
                    id="state" name="state" required
                    value={formData.state}
                    onChange={handleChange}
                    disabled={formData.pincode && formData.pincode.length === 6 && formData.state !== ""}
                    className={`w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none ${
                      formData.pincode && formData.pincode.length === 6 && formData.state !== ""
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed pointer-events-none"
                        : "bg-gray-50/50 cursor-pointer text-gray-900"
                    }`}
                  >
                    <option value="">Select State…</option>
                    {statesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
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
                placeholder="Street address, building name, locality, city"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
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
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setSelectedBooks([]);
              router.push("/specimen");
            }}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow transition-all cursor-pointer"
          >
            Submit Another Request
          </button>
          <Link
            href="/"
            onClick={() => {
              setSubmitted(false);
              setSelectedBooks([]);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer text-center"
          >
            Return to Home
          </Link>
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-gray-100">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Teacher Verification Required</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Specimen copies are free evaluation materials exclusively for verified school teachers &amp; educators. Please sign in with an approved teacher account or complete Teacher Registration.
            </p>

            <div className="space-y-3">
              <Link
                href="/auth/teacher-signup"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4" /> Register as Teacher →
              </Link>
              <Link
                href="/auth/signin?redirect=/specimen"
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Sign In with Existing Account
              </Link>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Specimen() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    }>
      <SpecimenContent />
    </Suspense>
  );
}
