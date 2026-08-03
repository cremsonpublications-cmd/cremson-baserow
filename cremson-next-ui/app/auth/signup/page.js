"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { register } from "../../../lib/api/auth";
import CPLogo from "../../../components/CPLogo";
import { useApp } from "../../../context/AppContext";
import api from "../../../lib/api/axios";
import {
  User,
  GraduationCap,
  Building2,
  Mail,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Plus,
  X,
} from "lucide-react";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useApp();

  const initialRole = searchParams.get("role") === "teacher" ? "teacher" : "student";
  const [roleTab, setRoleTab] = useState(initialRole);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  // Sync query param tab if changed
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "teacher") setRoleTab("teacher");
    else if (r === "student") setRoleTab("student");
  }, [searchParams]);

  // -------------------------------------------------------------
  // STUDENT FORM STATE
  // -------------------------------------------------------------
  const [studentForm, setStudentForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [studentPhoneStatus, setStudentPhoneStatus] = useState({ checking: false, available: null, reason: "" });
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentShowPassword, setStudentShowPassword] = useState(false);

  async function checkStudentPhone(phoneNum) {
    const clean = phoneNum.replace(/\D/g, "");
    if (clean.length < 10) {
      setStudentPhoneStatus({ checking: false, available: null, reason: "" });
      return;
    }
    setStudentPhoneStatus({ checking: true, available: null, reason: "" });
    try {
      const { data } = await api.get("/api/auth/check-phone", { params: { phone: clean } });
      setStudentPhoneStatus({ checking: false, available: data.available, reason: data.reason || "" });
    } catch (err) {
      setStudentPhoneStatus({ checking: false, available: true, reason: "" });
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentError("");

    if (!studentForm.phone || studentForm.phone.length !== 10) {
      setStudentError("Please enter a valid 10-digit phone number");
      return;
    }
    if (studentPhoneStatus.available === false) {
      setStudentError(studentPhoneStatus.reason || "This phone number is already registered.");
      return;
    }
    if (studentForm.password !== studentForm.confirm) {
      setStudentError("Passwords do not match");
      return;
    }
    if (studentForm.password.length < 8) {
      setStudentError("Password must be at least 8 characters");
      return;
    }

    setStudentLoading(true);
    try {
      await register({
        name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        password: studentForm.password,
      });
      router.push(`/auth/verify-email?email=${encodeURIComponent(studentForm.email)}`);
    } catch (err) {
      setStudentError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setStudentLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TEACHER FORM STATE
  // -------------------------------------------------------------
  const fileInputRef = useRef(null);
  const [teacherForm, setTeacherForm] = useState({
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

  const [teacherShowPassword, setTeacherShowPassword] = useState(false);
  const [teacherShowConfirmPassword, setTeacherShowConfirmPassword] = useState(false);
  const [teacherPhoneStatus, setTeacherPhoneStatus] = useState({ checking: false, available: null, reason: "" });

  const [schoolSearch, setSchoolSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const [schoolsList, setSchoolsList] = useState([]);
  const [schoolPage, setSchoolPage] = useState(1);
  const [hasMoreSchools, setHasMoreSchools] = useState(true);
  const [loadingMoreSchools, setLoadingMoreSchools] = useState(false);

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
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [teacherSubmitted, setTeacherSubmitted] = useState(false);
  const [teacherError, setTeacherError] = useState("");

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
      if (roleTab !== "teacher") return;
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
  }, [debouncedSearch, roleTab]);

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
    if ((scrollTop / scrollableDistance) * 100 >= 40) {
      loadMoreSchools();
    }
  }

  async function checkTeacherPhone(phoneNum) {
    const clean = phoneNum.replace(/\D/g, "");
    if (clean.length < 10) {
      setTeacherPhoneStatus({ checking: false, available: null, reason: "" });
      return;
    }
    setTeacherPhoneStatus({ checking: true, available: null, reason: "" });
    try {
      const { data } = await api.get("/api/auth/check-phone", { params: { phone: clean } });
      setTeacherPhoneStatus({ checking: false, available: data.available, reason: data.reason || "" });
    } catch (err) {
      setTeacherPhoneStatus({ checking: false, available: true, reason: "" });
    }
  }

  function handleTeacherChange(e) {
    const { name, value } = e.target;
    let cleanVal = value;
    if (name === "phone") {
      cleanVal = value.replace(/\D/g, "").slice(0, 10);
    }
    setTeacherForm((prev) => ({ ...prev, [name]: cleanVal }));
    if (name === "phone") {
      checkTeacherPhone(cleanVal);
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
      alert("Please provide required details: School Name, City, Address, and Pincode.");
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
    setTeacherForm((prev) => ({
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

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTeacherError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    setUploadingIdCard(true);
    setTeacherError("");
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

      setTeacherForm((prev) => ({ ...prev, idCardUrl: data.secure_url }));
      setIdCardPreview(data.secure_url);
    } catch (err) {
      setTeacherError(err?.message || "Failed to upload ID Card photo. Please try again.");
    } finally {
      setUploadingIdCard(false);
    }
  }

  async function handleTeacherSubmit(e) {
    e.preventDefault();
    setTeacherError("");

    if (teacherPhoneStatus.available === false) {
      setTeacherError(teacherPhoneStatus.reason || "This phone number is already registered.");
      return;
    }
    if (teacherForm.password.length < 8) {
      setTeacherError("Password must be at least 8 characters long.");
      return;
    }
    if (teacherForm.password !== teacherForm.confirmPassword) {
      setTeacherError("Passwords do not match.");
      return;
    }
    if (!teacherForm.idCardUrl) {
      setTeacherError("Please upload your Teacher / School ID Card photo for verification.");
      return;
    }
    if (!teacherForm.schoolId && !teacherForm.customSchoolName && !schoolSearch) {
      setTeacherError("Please select or specify your school name.");
      return;
    }

    setTeacherSubmitting(true);
    try {
      let selectedSchoolName = "";
      let schoolIdNum = null;

      if (selectedSchool && selectedSchool.id) {
        schoolIdNum = selectedSchool.id;
        selectedSchoolName = selectedSchool.SchoolName;
      } else if (teacherForm.schoolId && teacherForm.schoolId !== "other") {
        schoolIdNum = parseInt(teacherForm.schoolId);
        selectedSchoolName = teacherForm.customSchoolName || schoolSearch;
      } else {
        selectedSchoolName = teacherForm.customSchoolName || schoolSearch;
      }

      await api.post("/api/auth/teacher-register", {
        name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        password: teacherForm.password,
        school_id: schoolIdNum,
        school_name: selectedSchoolName,
        school_address: teacherForm.schoolAddress || selectedSchool?.SchoolAddress || "",
        school_phone: teacherForm.schoolPhone || selectedSchool?.SchoolPhone || "",
        school_email: teacherForm.schoolEmail || selectedSchool?.SchoolEmail || "",
        affiliation_code: teacherForm.affiliationCode || selectedSchool?.AffiliationCode || "",
        student_strength: teacherForm.studentStrength || selectedSchool?.StudentStrength || "",
        region: teacherForm.region || selectedSchool?.Region || "",
        pincode: teacherForm.pincode ? parseInt(teacherForm.pincode) : selectedSchool?.Pincode ? parseInt(selectedSchool.Pincode) : null,
        id_card_url: teacherForm.idCardUrl,
        designation: teacherForm.designation,
        city: selectedSchool?.City || teacherForm.city || "",
      });

      setTeacherSubmitted(true);
    } catch (err) {
      setTeacherError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setTeacherSubmitting(false);
    }
  }

  if (roleTab === "teacher" && teacherSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50/40 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Registration Submitted!</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Thank you, <strong className="text-gray-800">{teacherForm.name}</strong>.
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
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 via-white to-gray-50 flex items-center justify-center px-4 py-10">
      <div className={`w-full transition-all duration-300 ${roleTab === "teacher" ? "max-w-2xl" : "max-w-md"}`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <CPLogo className="max-w-[130px]" />
          </Link>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 transition-all">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-xs text-gray-500 mt-1">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-red-600 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Unified Role Selector Tabs */}
          <div className="bg-gray-100/80 p-1.5 rounded-2xl flex items-center gap-1 mb-6 border border-gray-200/60 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setRoleTab("student");
                router.replace("/auth/signup?role=student", { scroll: false });
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                roleTab === "student"
                  ? "bg-white text-gray-900 shadow-md border border-gray-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className={`w-4 h-4 ${roleTab === "student" ? "text-red-600" : "text-gray-400"}`} />
              <span>Student / Customer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab("teacher");
                router.replace("/auth/signup?role=teacher", { scroll: false });
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                roleTab === "teacher"
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${roleTab === "teacher" ? "text-white" : "text-gray-400"}`} />
              <span>Teacher / Educator</span>
            </button>
          </div>

          {/* ------------------------------------------------------------------------- */}
          {/* STUDENT REGISTRATION FORM */}
          {/* ------------------------------------------------------------------------- */}
          {roleTab === "student" && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {studentError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Mobile Number *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-semibold pointer-events-none border-r border-gray-200 pr-2">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={studentForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setStudentForm((f) => ({ ...f, phone: val }));
                      if (val.length < 10) setStudentPhoneStatus({ checking: false, available: null, reason: "" });
                    }}
                    onBlur={() => checkStudentPhone(studentForm.phone)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`w-full pl-[70px] pr-10 py-3 rounded-xl border text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      studentPhoneStatus.available === false
                        ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                        : studentPhoneStatus.available === true
                        ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-gray-200 bg-gray-50/50 focus:border-red-500 focus:ring-red-500/20"
                    }`}
                  />
                  <div className="absolute right-3 top-3.5">
                    {studentPhoneStatus.checking && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                    {!studentPhoneStatus.checking && studentPhoneStatus.available === true && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {!studentPhoneStatus.checking && studentPhoneStatus.available === false && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                {studentPhoneStatus.available === false && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{studentPhoneStatus.reason}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={studentShowPassword ? "text" : "password"}
                    name="password"
                    required
                    value={studentForm.password}
                    onChange={(e) => setStudentForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setStudentShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {studentShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                <input
                  type={studentShowPassword ? "text" : "password"}
                  name="confirm"
                  required
                  value={studentForm.confirm}
                  onChange={(e) => setStudentForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Re-enter password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={studentLoading || studentPhoneStatus.available === false}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                {studentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Account…
                  </>
                ) : (
                  "Create Student Account"
                )}
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------------------- */}
          {/* TEACHER REGISTRATION FORM */}
          {/* ------------------------------------------------------------------------- */}
          {roleTab === "teacher" && (
            <form onSubmit={handleTeacherSubmit} autoComplete="off" className="space-y-5">
              {teacherError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{teacherError}</span>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={teacherForm.name}
                    onChange={handleTeacherChange}
                    placeholder="e.g. Dr. Ramesh Sharma"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">WhatsApp Number *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500 text-xs font-semibold pointer-events-none border-r border-gray-200 pr-2">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={teacherForm.phone}
                      onChange={handleTeacherChange}
                      onBlur={() => checkTeacherPhone(teacherForm.phone)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full pl-[70px] pr-10 py-3 rounded-xl border text-sm focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        teacherPhoneStatus.available === false
                          ? "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/20"
                          : teacherPhoneStatus.available === true
                          ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                          : "border-gray-200 bg-gray-50/50 focus:border-red-500 focus:ring-red-500/20"
                      }`}
                    />
                    <div className="absolute right-3 top-3.5">
                      {teacherPhoneStatus.checking && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                      {!teacherPhoneStatus.checking && teacherPhoneStatus.available === true && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      {!teacherPhoneStatus.checking && teacherPhoneStatus.available === false && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {teacherPhoneStatus.available === false && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{teacherPhoneStatus.reason}</p>
                  )}
                </div>
              </div>

              {/* Email & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={teacherForm.email}
                      onChange={handleTeacherChange}
                      placeholder="teacher@school.edu.in"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Designation *</label>
                  <select
                    name="designation"
                    value={teacherForm.designation}
                    onChange={handleTeacherChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer font-medium text-gray-800"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Guest Teacher">Guest Teacher</option>
                  </select>
                </div>
              </div>

              {/* School Searchable Combobox */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">School / Institution *</label>
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Create New School
                  </button>
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="school_search_query"
                    autoComplete="off"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSchoolDropdownOpen(true);
                      setSelectedSchool(null);
                      setTeacherForm((prev) => ({ ...prev, schoolId: "other", customSchoolName: e.target.value }));
                    }}
                    onFocus={() => setSchoolDropdownOpen(true)}
                    placeholder="Type school name to search..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                  {selectedSchool && <Check className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-500" />}
                </div>

                {selectedSchool && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[10px] text-emerald-800 uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selected School
                      </span>
                    </div>
                    <p className="font-extrabold text-sm text-gray-900">{selectedSchool.SchoolName}</p>
                    {(selectedSchool.City || selectedSchool.SchoolCity) && (
                      <p className="text-gray-600">Location: {selectedSchool.City || selectedSchool.SchoolCity}</p>
                    )}
                  </div>
                )}

                {/* Dropdown Options */}
                {schoolDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSchoolDropdownOpen(false)} />
                    <div
                      onScroll={handleDropdownScroll}
                      className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1 divide-y divide-gray-100 text-xs"
                    >
                      {schoolsList.length > 0 ? (
                        schoolsList.map((school) => (
                          <div
                            key={school.id}
                            onClick={() => {
                              setSelectedSchool(school);
                              setSchoolSearch(
                                school.SchoolName + (school.City || school.SchoolCity ? ` (${school.City || school.SchoolCity})` : "")
                              );
                              setTeacherForm((prev) => ({
                                ...prev,
                                schoolId: school.id,
                                customSchoolName: school.SchoolName,
                                city: school.City || school.SchoolCity || "",
                              }));
                              setSchoolDropdownOpen(false);
                            }}
                            className="px-3.5 py-2.5 hover:bg-red-50/70 cursor-pointer transition-colors"
                          >
                            <p className="font-bold text-gray-900 text-xs">{school.SchoolName}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              📍 {school.City || school.SchoolCity || "No city specified"}
                            </p>
                          </div>
                        ))
                      ) : (
                        !loadingMoreSchools && (
                          <div className="px-3.5 py-2.5 text-xs text-gray-500">No schools matching search query</div>
                        )
                      )}
                      {loadingMoreSchools && (
                        <div className="py-2 text-center text-xs text-red-600 font-semibold flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* ID Card Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Upload ID Card / School Photo *
                </label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                <div
                  onClick={() => !uploadingIdCard && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                    idCardPreview
                      ? "border-green-300 bg-green-50/30"
                      : "border-gray-300 bg-gray-50/50 hover:bg-white hover:border-red-400"
                  }`}
                >
                  {uploadingIdCard ? (
                    <div className="py-3 flex flex-col items-center gap-1 text-red-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-semibold">Uploading...</span>
                    </div>
                  ) : idCardPreview ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <img src={idCardPreview} alt="Teacher ID" className="h-24 object-contain rounded-lg border shadow-sm" />
                      <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Photo Uploaded! Click to replace
                      </span>
                    </div>
                  ) : (
                    <div className="py-3 flex flex-col items-center gap-1 text-gray-500">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">Click to select ID Card image</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type={teacherShowPassword ? "text" : "password"}
                      name="password"
                      required
                      value={teacherForm.password}
                      onChange={handleTeacherChange}
                      placeholder="Min 8 chars"
                      className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setTeacherShowPassword(!teacherShowPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {teacherShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type={teacherShowConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={teacherForm.confirmPassword}
                      onChange={handleTeacherChange}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setTeacherShowConfirmPassword(!teacherShowConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {teacherShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={teacherSubmitting || uploadingIdCard || teacherPhoneStatus.available === false}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {teacherSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Teacher Account...
                  </>
                ) : (
                  "Submit Teacher Registration"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          By signing up you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-600">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-600">
            Privacy Policy
          </Link>.
        </p>
      </div>

      {/* Modal: Create New School */}
      {showNewSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
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
                <h3 className="text-base font-extrabold text-gray-900">Add New School / Institution</h3>
                <p className="text-xs text-gray-500">Provide school details to register your institution.</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewSchoolSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.name}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter school name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City / Location *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.city}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.address}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Address"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newSchoolData.pincode}
                    onChange={(e) => setNewSchoolData((prev) => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Pincode"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewSchoolModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-md"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}
