"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../lib/api/axios";
import {
  GraduationCap,
  Building2,
  Mail,
  Lock,
  Phone,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Plus,
  X,
  MapPin,
} from "lucide-react";

export default function TeacherSignUp() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    schoolId: "",
    customSchoolName: "",
    schoolAddress: "",
    pincode: "",
    schoolPhone: "",
    schoolEmail: "",
    affiliationCode: "",
    studentStrength: "",
    region: "",
    designation: "Teacher",
    city: "",
    idCardUrl: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState({ checking: false, available: null, reason: "" });

  // Infinite Scroll Schools Combobox States
  const [schoolSearch, setSchoolSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const [schoolsList, setSchoolsList] = useState([]);
  const [schoolPage, setSchoolPage] = useState(1);
  const [hasMoreSchools, setHasMoreSchools] = useState(true);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);

  // New School Modal State
  const [showNewSchoolModal, setShowNewSchoolModal] = useState(false);
  const [newSchoolData, setNewSchoolData] = useState({
    name: "",
    city: "",
    address: "",
    pincode: "",
    phone: "",
    email: "",
    affiliationCode: "",
    studentStrength: "",
    region: "",
  });

  const [idCardPreview, setIdCardPreview] = useState("");
  const [uploadingIdCard, setUploadingIdCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(schoolSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [schoolSearch]);

  // Fetch Page 1 when debounced search query changes
  useEffect(() => {
    let isMounted = true;
    async function fetchInitialSchools() {
      setLoadingMoreSchools(true);
      try {
        const params = { page: 1, size: 20, search: debouncedSearch.trim() || undefined };
        const { data } = await api.get("/api/crm/schools", { params });
        if (isMounted) {
          const results = data?.results || [];
          setSchoolsList(results);
          setSchoolPage(1);
          setHasMoreSchools(results.length === 20);
        }
      } catch (err) {
        console.error("Failed to load schools:", err);
      } finally {
        if (isMounted) setLoadingMoreSchools(false);
      }
    }
    fetchInitialSchools();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  // Infinite Scroll Load Next Page
  const loadMoreSchools = useCallback(async () => {
    if (loadingMoreSchools || !hasMoreSchools) return;
    setLoadingMoreSchools(true);
    const nextPage = schoolPage + 1;
    try {
      const params = { page: nextPage, size: 20, search: debouncedSearch.trim() || undefined };
      const { data } = await api.get("/api/crm/schools", { params });
      const newItems = data?.results || [];
      if (newItems.length > 0) {
        setSchoolsList((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const uniqueNew = newItems.filter((s) => !existingIds.has(s.id));
          return [...prev, ...uniqueNew];
        });
        setSchoolPage(nextPage);
        setHasMoreSchools(newItems.length === 20);
      } else {
        setHasMoreSchools(false);
      }
    } catch (err) {
      console.error("Failed to load more schools:", err);
    } finally {
      setLoadingMoreSchools(false);
    }
  }, [loadingMoreSchools, hasMoreSchools, schoolPage, debouncedSearch]);

  function handleDropdownScroll(e) {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    e.stopPropagation();

    const scrollableDistance = scrollHeight - clientHeight;
    if (scrollableDistance <= 0) return;

    const scrollPercentage = (scrollTop / scrollableDistance) * 100;
    if (scrollPercentage >= 40) {
      loadMoreSchools();
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone") {
      checkPhoneUnique(value);
    }
  }

  async function checkPhoneUnique(phoneNum) {
    const clean = phoneNum.replace(/\D/g, "");
    if (clean.length < 10) {
      setPhoneStatus({ checking: false, available: null, reason: "" });
      return;
    }
    setPhoneStatus({ checking: true, available: null, reason: "" });
    try {
      const { data } = await api.get("/api/auth/check-phone", { params: { phone: clean } });
      setPhoneStatus({ checking: false, available: data.available, reason: data.reason || "" });
    } catch (err) {
      setPhoneStatus({ checking: false, available: true, reason: "" });
    }
  }

  function handleCreateNewSchoolSubmit(e) {
    e.preventDefault();
    if (
      !newSchoolData.name.trim() ||
      !newSchoolData.city.trim() ||
      !newSchoolData.address.trim() ||
      !newSchoolData.pincode.trim()
    ) {
      alert("Please provide all required details: School Name, City, Address, and Pincode.");
      return;
    }

    const createdSchool = {
      id: null,
      isCustom: true,
      SchoolName: newSchoolData.name.trim(),
      City: newSchoolData.city.trim(),
      SchoolAddress: newSchoolData.address.trim(),
      Pincode: newSchoolData.pincode.trim(),
      SchoolPhone: newSchoolData.phone.trim(),
      SchoolEmail: newSchoolData.email.trim(),
      AffiliationCode: newSchoolData.affiliationCode.trim(),
      StudentStrength: newSchoolData.studentStrength.trim(),
      Region: newSchoolData.region.trim(),
    };

    setSelectedSchool(createdSchool);
    setSchoolSearch(`${createdSchool.SchoolName} (${createdSchool.City})`);
    setFormData((prev) => ({
      ...prev,
      schoolId: "other",
      customSchoolName: createdSchool.SchoolName,
      city: createdSchool.City,
      schoolAddress: createdSchool.SchoolAddress,
      pincode: createdSchool.Pincode,
      schoolPhone: createdSchool.SchoolPhone,
      schoolEmail: createdSchool.SchoolEmail,
      affiliationCode: createdSchool.AffiliationCode,
      studentStrength: createdSchool.StudentStrength,
      region: createdSchool.Region,
    }));

    setShowNewSchoolModal(false);
    setSchoolDropdownOpen(false);
  }

  // Cloudinary ID Card Upload
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setUploadingIdCard(true);
    setError("");

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

      setFormData((prev) => ({ ...prev, idCardUrl: data.secure_url }));
      setIdCardPreview(data.secure_url);
    } catch (err) {
      setError(err?.message || "Failed to upload ID Card photo. Please try again.");
    } finally {
      setUploadingIdCard(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (phoneStatus.available === false) {
      setError(phoneStatus.reason || "This phone number is already registered or rejected.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.idCardUrl) {
      setError("Please upload your Teacher / School ID Card photo for verification.");
      return;
    }

    if (!formData.schoolId && !formData.customSchoolName && !schoolSearch) {
      setError("Please select or specify your school name.");
      return;
    }

    setSubmitting(true);

    try {
      let selectedSchoolName = "";
      let schoolIdNum = null;

      if (selectedSchool && selectedSchool.id) {
        schoolIdNum = selectedSchool.id;
        selectedSchoolName = selectedSchool.SchoolName;
      } else if (formData.schoolId && formData.schoolId !== "other") {
        schoolIdNum = parseInt(formData.schoolId);
        selectedSchoolName = formData.customSchoolName || schoolSearch;
      } else {
        selectedSchoolName = formData.customSchoolName || schoolSearch;
      }

      await api.post("/api/auth/teacher-register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        school_id: schoolIdNum,
        school_name: selectedSchoolName,
        school_address: formData.schoolAddress || selectedSchool?.SchoolAddress || "",
        school_phone: formData.schoolPhone || selectedSchool?.SchoolPhone || "",
        school_email: formData.schoolEmail || selectedSchool?.SchoolEmail || "",
        affiliation_code: formData.affiliationCode || selectedSchool?.AffiliationCode || "",
        student_strength: formData.studentStrength || selectedSchool?.StudentStrength || "",
        region: formData.region || selectedSchool?.Region || "",
        pincode: formData.pincode ? parseInt(formData.pincode) : selectedSchool?.Pincode ? parseInt(selectedSchool.Pincode) : null,
        id_card_url: formData.idCardUrl,
        designation: formData.designation,
        city: selectedSchool?.City || formData.city || "",
      });

      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/40 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Thank you, <strong className="text-gray-800">{formData.name}</strong>. A WhatsApp message has been dispatched to your phone number.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left mb-6 text-xs text-emerald-800 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-emerald-900">
              💬 WhatsApp Confirmation Sent
            </p>
            <p>We will review your ID card and verify your teacher account within <strong>24 hours</strong>. Once approved, you will receive an instant WhatsApp approval message with your sign-in link.</p>
          </div>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
      <div className="max-w-2xl w-full">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-start mb-6">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-gray-500" /> Back to Sign In
            </Link>
          </div>

          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-red-200/60">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Registration</h1>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            Sign up as an educator to request free specimen books and access answer keys. Admin approval required.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-10 text-left relative">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Ramesh Sharma"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Whatsapp / Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => checkPhoneUnique(formData.phone)}
                    placeholder="10-digit mobile number"
                    className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      phoneStatus.available === false
                        ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                        : phoneStatus.available === true
                        ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-gray-200 bg-gray-50/50 focus:border-red-500 focus:ring-red-500/20"
                    }`}
                  />
                  <div className="absolute right-3.5 top-3.5">
                    {phoneStatus.checking && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                    {!phoneStatus.checking && phoneStatus.available === true && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {!phoneStatus.checking && phoneStatus.available === false && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                {phoneStatus.available === false && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{phoneStatus.reason}</p>
                )}
                {phoneStatus.available === true && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">✓ Unique WhatsApp number</p>
                )}
              </div>
            </div>

            {/* Email & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="teacher@school.edu.in"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Designation *
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer font-medium text-gray-800"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Guest Teacher">Guest Teacher</option>
                </select>
              </div>
            </div>

            {/* Searchable Infinite-Scroll School Combobox */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  School / Institution *
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setNewSchoolData({
                      name: schoolSearch,
                      city: "",
                      address: "",
                      pincode: "",
                      phone: "",
                      email: "",
                      affiliationCode: "",
                      studentStrength: "",
                      region: "",
                    });
                    setShowNewSchoolModal(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Can&apos;t find your school? Create New School
                </button>
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="school_search_query_no_autofill"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    setSchoolDropdownOpen(true);
                    setSelectedSchool(null);
                    setFormData((prev) => ({ ...prev, schoolId: "other", customSchoolName: e.target.value }));
                  }}
                  onFocus={() => setSchoolDropdownOpen(true)}
                  placeholder="Type to search school or enter new school..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                {selectedSchool && (
                  <Check className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-500" />
                )}
              </div>

              {selectedSchool && (
                <div className="mt-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />{" "}
                      {selectedSchool.isCustom ? "Custom Created School" : "Selected School Details"}
                    </span>
                    {selectedSchool.id && (
                      <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded-full text-emerald-900">
                        ID #{selectedSchool.id}
                      </span>
                    )}
                  </div>

                  <p className="font-extrabold text-sm text-gray-900">{selectedSchool.SchoolName}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-600 text-xs pt-1.5 border-t border-emerald-200/60">
                    {(selectedSchool.City || selectedSchool.SchoolCity) && (
                      <p><strong>City / Location:</strong> {selectedSchool.City || selectedSchool.SchoolCity}</p>
                    )}
                    {(selectedSchool.SchoolAddress || selectedSchool.Address) && (
                      <p><strong>Address:</strong> {selectedSchool.SchoolAddress || selectedSchool.Address}</p>
                    )}
                    {(selectedSchool.Pincode || selectedSchool.pincode) && (
                      <p><strong>Pincode:</strong> {selectedSchool.Pincode || selectedSchool.pincode}</p>
                    )}
                    {(selectedSchool.SchoolPhone || selectedSchool.Phone) && (
                      <p><strong>Phone:</strong> {selectedSchool.SchoolPhone || selectedSchool.Phone}</p>
                    )}
                    {(selectedSchool.SchoolEmail || selectedSchool.Email) && (
                      <p><strong>Email:</strong> {selectedSchool.SchoolEmail || selectedSchool.Email}</p>
                    )}
                    {(selectedSchool.AffiliationCode || selectedSchool.affiliationCode) && (
                      <p><strong>Affiliation Code:</strong> {selectedSchool.AffiliationCode || selectedSchool.affiliationCode}</p>
                    )}
                    {(selectedSchool.StudentStrength || selectedSchool.studentStrength) && (
                      <p><strong>Student Strength:</strong> {selectedSchool.StudentStrength || selectedSchool.studentStrength}</p>
                    )}
                    {(selectedSchool.Region || selectedSchool.region) && (
                      <p><strong>Region:</strong> {selectedSchool.Region || selectedSchool.region}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Infinite Scroll Dropdown Results */}
              {schoolDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSchoolDropdownOpen(false)}
                  />
                  <div
                    onScroll={handleDropdownScroll}
                    className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto overscroll-contain bg-white border border-gray-200 rounded-2xl shadow-xl py-1 divide-y divide-gray-100 text-sm"
                  >
                    {schoolsList.length > 0 ? (
                      schoolsList.map((school) => (
                        <div
                          key={school.id}
                          onClick={() => {
                            setSelectedSchool(school);
                            setSchoolSearch(school.SchoolName + (school.City || school.SchoolCity ? ` (${school.City || school.SchoolCity})` : ""));
                            setFormData((prev) => ({
                              ...prev,
                              schoolId: school.id,
                              customSchoolName: school.SchoolName,
                              city: school.City || school.SchoolCity || "",
                            }));
                            setSchoolDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-red-50/70 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-bold text-gray-900 text-sm leading-snug">{school.SchoolName}</p>
                              
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                {(school.City || school.SchoolCity) && (
                                  <span className="font-semibold text-gray-700 flex items-center gap-1">
                                    📍 {school.City || school.SchoolCity}
                                  </span>
                                )}
                                {(school.SchoolAddress || school.Address) && (
                                  <span className="text-gray-500 flex items-center gap-1">
                                    🏢 {school.SchoolAddress || school.Address}
                                  </span>
                                )}
                                {(school.SchoolPhone || school.Phone) && (
                                  <span className="text-gray-400">📞 {school.SchoolPhone || school.Phone}</span>
                                )}
                                {school.AffiliationCode && (
                                  <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                    Code: {school.AffiliationCode}
                                  </span>
                                )}
                              </div>
                            </div>

                            {selectedSchool?.id === school.id && (
                              <Check className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      !loadingMoreSchools && (
                        <div className="px-4 py-3 text-xs text-gray-500">
                          No existing school matches &quot;{schoolSearch}&quot;
                        </div>
                      )
                    )}

                    {loadingMoreSchools && (
                      <div className="py-2.5 text-center text-xs text-red-600 font-semibold flex items-center justify-center gap-1.5 bg-gray-50/50">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading schools...
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ID Card Image Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Upload Teacher ID Card / School Photo *
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div
                onClick={() => !uploadingIdCard && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  idCardPreview
                    ? "border-green-300 bg-green-50/30"
                    : "border-gray-300 bg-gray-50/50 hover:bg-white hover:border-red-400"
                }`}
              >
                {uploadingIdCard ? (
                  <div className="py-4 flex flex-col items-center gap-2 text-red-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-semibold">Uploading ID Card photo...</span>
                  </div>
                ) : idCardPreview ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <img
                      src={idCardPreview}
                      alt="Teacher ID Card"
                      className="h-32 object-contain rounded-xl border border-gray-200 shadow"
                    />
                    <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Photo Uploaded! Click to change
                    </span>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-2 text-gray-500">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">Click to select ID Card image</span>
                    <span className="text-[11px] text-gray-400">Supports JPG, PNG, WEBP</span>
                  </div>
                )}
              </div>
            </div>

            {/* Password & Confirm Password with Eye Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || uploadingIdCard || phoneStatus.available === false}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                "Submit Teacher Registration"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Create New School */}
      {showNewSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNewSchoolModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Add New School / Institution</h3>
                <p className="text-xs text-gray-500">Provide all school details to register your institution in our CRM.</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewSchoolSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.name}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter school name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    City/Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.city}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city/location"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.address}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.pincode}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Enter pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newSchoolData.phone}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newSchoolData.email}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Affiliation Code
                  </label>
                  <input
                    type="text"
                    value={newSchoolData.affiliationCode}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, affiliationCode: e.target.value }))}
                    placeholder="Enter affiliation code"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Student Strength
                  </label>
                  <input
                    type="text"
                    value={newSchoolData.studentStrength}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, studentStrength: e.target.value }))}
                    placeholder="Enter student strength"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={newSchoolData.region}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, region: e.target.value }))}
                    placeholder="Enter region"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewSchoolModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-md transition-all"
                >
                  Save &amp; Select School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
