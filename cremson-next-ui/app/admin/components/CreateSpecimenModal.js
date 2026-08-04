"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import {
  Search,
  X,
  UserCheck,
  BookOpen,
  Send,
  RefreshCw,
} from "lucide-react";

export default function CreateSpecimenModal({ onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [form, setForm] = useState({
    teacher_name: "",
    school_name: "",
    phone: "",
    email: "",
    full_address: "",
    city: "",
    pincode: "",
    feedback_notes: "",
    dispatch_immediately: true,
  });

  const [selectedBooks, setSelectedBooks] = useState([]);

  // Fetch teachers from CRM table 877
  const { data: teachersData } = useQuery({
    queryKey: ["crm-teachers-search", teacherSearch],
    queryFn: async () => {
      const { data } = await api.get("/api/crm/teachers", {
        params: { search: teacherSearch, size: 50 },
      });
      return data?.results || [];
    },
    enabled: teacherSearch.length >= 2,
  });

  // Fetch product catalog for books multiselect
  const { data: catalogProducts = [] } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  function selectTeacher(teacher) {
    setSelectedTeacher(teacher);
    let sName = "";
    if (Array.isArray(teacher["School Name"])) {
      sName = teacher["School Name"].map((s) => (typeof s === "object" ? s.value || s.name : s)).filter(Boolean).join(", ");
    } else if (Array.isArray(teacher["SchoolID"])) {
      sName = teacher["SchoolID"].map((s) => (typeof s === "object" ? s.value || s.name : s)).filter(Boolean).join(", ");
    }

    setForm((f) => ({
      ...f,
      teacher_name: teacher["Teacher Name"] || "",
      school_name: sName || f.school_name || "",
      phone: teacher["Whatsapp Phone"] || teacher["Phone"] || "",
      email: teacher["Email"] || "",
      full_address: teacher["Residence"] || teacher["SchoolAddress"] || "",
      city: teacher["City"] || "",
      pincode: teacher["Pin Code"] ? String(teacher["Pin Code"]) : "",
    }));
    setTeacherSearch("");
  }

  function toggleBook(bookName) {
    setSelectedBooks((prev) =>
      prev.includes(bookName) ? prev.filter((b) => b !== bookName) : [...prev, bookName]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedBooks.length === 0) {
      toast.error("Please select at least one book from the catalog.");
      return;
    }
    if (!form.teacher_name || !form.phone || !form.full_address) {
      toast.error("Teacher Name, Phone Number, and Address are required.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (form.pincode && (form.pincode.length !== 6 || !/^\d{6}$/.test(form.pincode))) {
      toast.error("Pincode must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        teacher_id: selectedTeacher?.id || null,
        teacher_name: form.teacher_name,
        school_name: form.school_name,
        phone: form.phone,
        email: form.email,
        full_address: form.full_address,
        city: form.city,
        pincode: form.pincode,
        books_requested: selectedBooks,
        feedback_notes: form.feedback_notes,
        dispatch_immediately: form.dispatch_immediately,
      };

      const res = await api.post("/api/specimen-requests/admin-create", payload);

      if (res.data?.warning) {
        const warnMsg = typeof res.data.warning === "string" ? res.data.warning : JSON.stringify(res.data.warning);
        toast.warning(warnMsg);
      } else {
        const succMsg = typeof res.data?.message === "string" ? res.data.message : "Specimen request created successfully!";
        toast.success(succMsg);
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const errorMsg = typeof detail === "string" ? detail : (typeof detail === "object" ? JSON.stringify(detail) : err?.message || "Failed to create specimen request.");
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10 text-left">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Specimen Request</h2>
            <p className="text-xs text-slate-500 mt-1">Admin creation on behalf of a teacher (No password needed)</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-5 text-left">
          
          {/* Search Registered Teacher */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Registered Teacher (CRM)
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type teacher name, school, or phone to auto-fill..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              />
            </div>

            {selectedTeacher && (
              <div className="mt-2 flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Auto-filled: {selectedTeacher["Teacher Name"]} ({selectedTeacher["Whatsapp Phone"] || "No Phone"})
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {teacherSearch.length >= 2 && teachersData && teachersData.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                {teachersData.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTeacher(t)}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{t["Teacher Name"]}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{t["City"] ? `${t["City"]} • ` : ""}{t["Whatsapp Phone"] || t["Email"] || ""}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teacher Info Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Teacher Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                School Name
              </label>
              <input
                type="text"
                value={form.school_name}
                onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                placeholder="School Name"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 flex items-center gap-1 select-none border-r border-slate-200 pr-2">
                  🇮🇳 +91
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="9876543210"
                  className="w-full pl-[70px] pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="teacher@school.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Shipping Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={form.full_address}
                onChange={(e) => setForm({ ...form, full_address: e.target.value })}
                placeholder="House/Street, Landmark, City, State, Pincode"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="6-digit Pincode"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Select Requested Books */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Select Books from Website Catalog ({selectedBooks.length} selected) <span className="text-red-500">*</span></span>
            </label>
            <div className="max-h-48 overflow-y-auto p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
              {catalogProducts.map((p) => {
                const isSelected = selectedBooks.includes(p.name);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleBook(p.name)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? "bg-red-50 border-red-300" : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    {p.main_image ? (
                      <img src={p.main_image} alt={p.name} className="w-9 h-11 object-cover rounded-lg border border-slate-200 shadow-xs flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-11 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.author || "Cremson Publications"} {p.weight ? `• ${p.weight}` : ""}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dispatch Immediately Checkbox */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="dispatch_immediately"
              checked={form.dispatch_immediately}
              onChange={(e) => setForm({ ...form, dispatch_immediately: e.target.checked })}
              className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="dispatch_immediately" className="cursor-pointer">
              <span className="text-xs font-bold text-amber-900 block">Approve & Dispatch Immediately via Shipway</span>
              <span className="text-[11px] text-amber-700 block mt-0.5 leading-relaxed">
                If checked, the system will immediately generate the Shipway AWB tracking label, mark the status as <strong>Dispatched</strong>, and send an automated WhatsApp tracking notification directly to the teacher's WhatsApp number.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Processing..." : form.dispatch_immediately ? "Create & Dispatch Now" : "Create as Pending"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
