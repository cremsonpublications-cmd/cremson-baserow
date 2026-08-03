"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { toast } from "sonner";
import {
  Building2,
  GraduationCap,
  BookOpen,
  FileText,
  BookMarked,
  Search,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Pen,
  Trash2,
  Plus
} from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";
import CreateSpecimenModal from "../components/CreateSpecimenModal";
import {
  adminCreateSchool,
  adminUpdateSchool,
  adminDeleteSchool,
  adminCreateTeacher,
  adminUpdateTeacher,
  adminDeleteTeacher,
  adminCreateCRMBook,
  adminUpdateCRMBook,
  adminDeleteCRMBook,
  adminCreateSubject,
  adminUpdateSubject,
  adminDeleteSubject,
  adminCreateSpecimenRequest,
  adminUpdateSpecimenRequest,
  adminDeleteSpecimenRequest
} from "../../../lib/api/admin";

const TABS = [
  { id: "schools", label: "Schools", singularLabel: "School", icon: Building2, endpoint: "/api/crm/schools", baserowUrl: "http://200.141.5.200/database/279/table/876/3619" },
  { id: "teachers", label: "Teachers", singularLabel: "Teacher", icon: GraduationCap, endpoint: "/api/crm/teachers", baserowUrl: "http://200.141.5.200/database/279/table/877/3620" },
  { id: "specimen", label: "Specimen Requests", singularLabel: "Specimen Request", icon: FileText, endpoint: "/api/specimen-requests", baserowUrl: "http://200.141.5.200/database/279/table/878/3624" },
  { id: "books", label: "CRM Books Catalog", singularLabel: "CRM Book", icon: BookOpen, endpoint: "/api/crm/books", baserowUrl: "http://200.141.5.200/database/279/table/879/3628" },
  { id: "subjects", label: "Subjects", singularLabel: "Subject", icon: BookMarked, endpoint: "/api/crm/subjects", baserowUrl: "http://200.141.5.200/database/279/table/880/3629" },
];

const FIELDS_CONFIG = {
  schools: [
    { key: "SchoolName", label: "School Name", type: "text", required: true },
    { key: "SchoolCity", label: "City/Location", type: "text" },
    { key: "SchoolAddress", label: "Address", type: "textarea" },
    { key: "SchoolPhone", label: "Phone", type: "text" },
    { key: "SchoolEmail", label: "Email", type: "email" },
    { key: "AffiliationCode", label: "Affiliation Code", type: "text" },
    { key: "StudentStrength", label: "Student Strength", type: "text" },
    { key: "Region", label: "Region", type: "text" },
    { key: "Notes", label: "Notes", type: "textarea" }
  ],
  teachers: [
    { key: "Teacher Name", label: "Teacher Name", type: "text", required: true },
    { key: "Whatsapp Phone", label: "Whatsapp Phone", type: "text" },
    { key: "Residence", label: "Residence", type: "text" },
    { key: "Pin Code", label: "Pin Code", type: "number" },
    { key: "Email", label: "Email", type: "email" },
    { key: "Alternate Number", label: "Alternate Number", type: "text" },
    { key: "City", label: "City", type: "text" },
    { key: "LastCallDate", label: "Last Call Date", type: "date" },
    { key: "NextFollow-upDate", label: "Next Follow-up Date", type: "date" },
    { key: "Status", label: "Status", type: "select", options: ["Approved", "Pending Approval", "Rejected", "Called", "Follow up", "Interested", "Ordered", "Inactive"] },
    { key: "Interest Level", label: "Interest Level", type: "select", options: ["Hot", "Warm", "Cold"] },
    { key: "DecisionPower", label: "Decision Power", type: "select", options: ["Decision Maker", "Influencer", "Assistant"], filterable: false },
    { key: "Ordered", label: "Ordered", type: "boolean" },
    { key: "Notes", label: "Notes", type: "textarea" },
    { key: "Guest", label: "Guest Teacher", type: "boolean", filterable: false },
    { key: "SchoolID", label: "Linked School", type: "link", targetTab: "schools", targetEndpoint: "/api/crm/schools" },
    { key: "Subject", label: "Linked Subjects", type: "link", targetTab: "subjects", targetEndpoint: "/api/crm/subjects", multiple: true }
  ],
  specimen: [
    { key: "RequestDate", label: "Request Date", type: "date" },
    { key: "DeliveryStatus", label: "Delivery Status", type: "select", options: ["In Transit", "Delivered", "RTO", "Dispatched", "Not dispatched", "HandDelivered"] },
    { key: "FollowUpStage", label: "Follow-Up Stage", type: "select", options: ["NotStarted", "Day7", "Day30", "Done"], filterable: false },
    { key: "DispatchMethod", label: "Dispatch Method", type: "select", options: ["Courier", "Hand Delivery", "Book Shop", "Other"], filterable: false },
    { key: "AWB_Number", label: "AWB Number", type: "text" },
    { key: "TrackingLink", label: "Tracking Link", type: "text" },
    { key: "Courier_Partner", label: "Courier Partner", type: "select", options: ["Delhivery", "XpressBees", "ShadowFax", "BlueDart", "Ekart"], filterable: false },
    { key: "DispatchDate", label: "Dispatch Date", type: "date" },
    { key: "DeliveryConfirmed", label: "Delivery Confirmed", type: "boolean", filterable: false },
    { key: "BooksRequested", label: "Books Requested", type: "textarea" },
    { key: "Feedback/Notes", label: "Feedback / Notes", type: "textarea" },
    { key: "ConversionStatus", label: "Conversion Status", type: "select", options: ["Pending", "Ordered", "Rejected"], filterable: false },
    { key: "ConversionNotes", label: "Conversion Notes", type: "textarea" },
    { key: "Converted", label: "Converted", type: "select", options: ["⏳ Pending", "✅ Yes", "❌ No — Dead"], filterable: false },
    { key: "Full_Address", label: "Full Address", type: "textarea" },
    { key: "TeacherID", label: "Linked Teacher", type: "link", targetTab: "teachers", targetEndpoint: "/api/crm/teachers" },
    { key: "BookCategory", label: "Linked Books Category", type: "link", targetTab: "books", targetEndpoint: "/api/crm/books", multiple: true }
  ],
  books: [
    { key: "BookName", label: "Book Name", type: "text", required: true },
    { key: "Author", label: "Author", type: "text" },
    { key: "Class", label: "Class", type: "number" },
    { key: "Series", label: "Series", type: "select", options: ["Textbook", "Lab Manual", "Sample Paper", "Workbook", "Guide", "Project Work"], required: true },
    { key: "Active", label: "Active", type: "boolean" },
    { key: "Subject", label: "Subject", type: "link", targetTab: "subjects", targetEndpoint: "/api/crm/subjects" }
  ],
  subjects: [
    { key: "Name", label: "Subject Name", type: "text", required: true },
    { key: "Notes", label: "Notes", type: "textarea" },
    { key: "Active", label: "Active", type: "boolean" },
    { key: "Books", label: "Linked Books", type: "link", targetTab: "books", targetEndpoint: "/api/crm/books", multiple: true }
  ]
};

const TABLE_COLUMNS = {
  schools: ["SchoolName", "SchoolCity", "SchoolPhone", "SchoolEmail", "AffiliationCode"],
  teachers: ["Teacher Name", "School Name", "Whatsapp Phone", "Status", "Interest Level"],
  specimen: ["Teacheer Name", "School Name", "DeliveryStatus", "Converted", "DispatchDate"],
  books: ["BookName", "Class", "Series", "Active"],
  subjects: ["Name", "Active"]
};

const API_CALLS = {
  schools: {
    create: adminCreateSchool,
    update: adminUpdateSchool,
    delete: adminDeleteSchool
  },
  teachers: {
    create: adminCreateTeacher,
    update: adminUpdateTeacher,
    delete: adminDeleteTeacher
  },
  books: {
    create: adminCreateCRMBook,
    update: adminUpdateCRMBook,
    delete: adminDeleteCRMBook
  },
  subjects: {
    create: adminCreateSubject,
    update: adminUpdateSubject,
    delete: adminDeleteSubject
  },
  specimen: {
    create: adminCreateSpecimenRequest,
    update: adminUpdateSpecimenRequest,
    delete: adminDeleteSpecimenRequest
  }
};

function getInitialValue(field, record) {
  if (!record || record.id === undefined) {
    if (field.type === "boolean") return false;
    if (field.type === "link") return field.multiple ? [] : null;
    return "";
  }
  let val = record[field.key];
  if (val === null || val === undefined) {
    if (field.type === "boolean") return false;
    if (field.type === "link") return field.multiple ? [] : null;
    return "";
  }
  if (field.type === "link") {
    let isMultiple = field.multiple;
    if (field.key === "SchoolID" && record.Guest !== undefined) {
      isMultiple = !!record.Guest;
    }
    if (Array.isArray(val)) {
      const mapped = val.map(x => ({ id: x.id, value: x.value }));
      return isMultiple ? mapped : (mapped[0] || null);
    }
    const item = val && val.id ? { id: val.id, value: val.value } : null;
    return isMultiple ? (item ? [item] : []) : item;
  }
  if (field.type === "select") {
    if (Array.isArray(val)) {
      return val[0]?.value || val[0] || "";
    }
    if (typeof val === "object") {
      return val.value || "";
    }
    return val;
  }
  if (field.type === "boolean") {
    return !!val;
  }
  return val;
}

function RelationPicker({ field, value, onChange }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const containerRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const targetTabObj = TABS.find(t => t.id === field.targetTab);
  const linkBtnLabel = targetTabObj ? `+ Link ${targetTabObj.singularLabel}` : "+ Link Record";

  const fetchPage = async (pageNum, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.get(field.targetEndpoint, {
        params: { page: pageNum, size: 20, search: search || undefined }
      });
      const items = res.data?.results ?? res.data?.items ?? [];
      const totalCount = res.data?.count ?? 0;

      setResults(prev => {
        const nextResults = isInitial ? items : [...prev, ...items];
        setHasMore(nextResults.length < totalCount);
        return nextResults;
      });
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch relation results:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      fetchPage(1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, open, field.targetEndpoint]);

  const handleScroll = (e) => {
    const container = e.target;
    if (
      container.scrollHeight - container.scrollTop - container.clientHeight < 20 &&
      !loading &&
      !loadingMore &&
      hasMore
    ) {
      fetchPage(page + 1, false);
    }
  };

  const selectedList = Array.isArray(value) ? value : value ? [value] : [];

  function handleSelect(item) {
    const displayValue = item.value || item.SchoolName || item["Teacher Name"] || item.TeacherName || item.BookName || item.Name || `ID ${item.id}`;
    const mapped = { id: item.id, value: displayValue };

    if (field.multiple) {
      if (selectedList.some(x => x.id === item.id)) {
        onChange(selectedList.filter(x => x.id !== item.id));
      } else {
        onChange([...selectedList, mapped]);
      }
    } else {
      onChange(mapped);
      setOpen(false);
    }
  }

  function handleRemove(id) {
    if (field.multiple) {
      onChange(selectedList.filter(x => x.id !== id));
    } else {
      onChange(null);
    }
  }

  return (
    <div ref={pickerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-300 rounded-lg min-h-[42px] bg-white items-center">
        {selectedList.map(item => (
          <span key={item.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {item.value || `ID ${item.id}`}
            <button type="button" onClick={() => handleRemove(item.id)} className="hover:text-blue-900 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 ml-auto cursor-pointer"
        >
          {open ? "Close" : linkBtnLabel}
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 p-2 flex flex-col">
          <input
            type="text"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none mb-2 shrink-0"
          />
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto grow space-y-1 pr-0.5"
          >
            {loading ? (
              <p className="text-center text-xs text-gray-500 py-3">Loading...</p>
            ) : results.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-3">No matching records found</p>
            ) : (
              <>
                {results.map(item => {
                  const displayVal = item.value || item.SchoolName || item["Teacher Name"] || item.TeacherName || item.BookName || item.Name || `ID ${item.id}`;
                  const isSelected = selectedList.some(x => x.id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex justify-between items-center cursor-pointer ${isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                      <span>{displayVal}</span>
                      <span className="text-[10px] text-gray-400 font-mono">#{item.id}</span>
                    </button>
                  );
                })}
                {loadingMore && (
                  <p className="text-center text-[10px] text-gray-400 py-1.5 animate-pulse">Loading more...</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CRMFormModal({ activeTab, record, onClose, onSaved }) {
  const isEdit = record && record.id !== undefined;
  const fields = FIELDS_CONFIG[activeTab] || [];

  const [form, setForm] = useState(() => {
    const initial = {};
    fields.forEach(field => {
      initial[field.key] = getInitialValue(field, record);
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const tabLabel = TABS.find(t => t.id === activeTab)?.label || "Record";

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      if (form["Whatsapp Phone"]) {
        const val = String(form["Whatsapp Phone"]).trim();
        if (val && !/^\d{10}$/.test(val)) {
          throw new Error("Whatsapp Phone must be exactly 10 digits.");
        }
      }
      if (form["Alternate Number"]) {
        const val = String(form["Alternate Number"]).trim();
        if (val && !/^\d{10}$/.test(val)) {
          throw new Error("Alternate Number must be exactly 10 digits.");
        }
      }
      if (form["Pin Code"]) {
        const val = String(form["Pin Code"]).trim();
        if (val && !/^\d{6}$/.test(val)) {
          throw new Error("Pin Code must be exactly 6 digits.");
        }
      }
      if (form["SchoolPhone"]) {
        const val = String(form["SchoolPhone"]).trim();
        if (val && !/^\d{10}$/.test(val)) {
          throw new Error("School Phone must be exactly 10 digits.");
        }
      }

      const payload = {};
      fields.forEach(field => {
        const val = form[field.key];

        let isMultiple = field.multiple;
        if (activeTab === "teachers" && field.key === "SchoolID") {
          isMultiple = !!form["Guest"];
        }

        if (field.type === "link") {
          if (isMultiple) {
            payload[field.key] = Array.isArray(val) ? val.map(x => x.id) : [];
          } else {
            if (Array.isArray(val)) {
              payload[field.key] = val.length > 0 && val[0] && val[0].id ? [val[0].id] : [];
            } else {
              payload[field.key] = val && val.id ? [val.id] : [];
            }
          }
        } else {
          payload[field.key] = val === "" ? null : val;
        }
      });

      const apiCalls = API_CALLS[activeTab];
      if (isEdit) {
        await apiCalls.update(record.id, payload);
      } else {
        await apiCalls.create(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      if (!err.config) {
        toast.error(err.message || "Failed to save record.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? `Edit ${tabLabel} #${record.id}` : `Add New ${tabLabel}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => {
              const value = form[field.key];

              const onChange = (newVal) => {
                setForm(f => {
                  const updated = { ...f, [field.key]: newVal };
                  if (activeTab === "teachers" && field.key === "Guest" && !newVal) {
                    if (Array.isArray(updated["SchoolID"])) {
                      updated["SchoolID"] = updated["SchoolID"].slice(0, 1);
                    }
                  }
                  return updated;
                });

                if (activeTab === "teachers" && field.key === "SchoolID" && newVal) {
                  const schoolId = Array.isArray(newVal)
                    ? (newVal.length > 0 ? newVal[0].id : null)
                    : newVal.id;

                  if (schoolId) {
                    api.get(`/api/crm/schools/${schoolId}`)
                      .then(res => {
                        const schoolData = res.data;
                        if (schoolData) {
                          setForm(f => ({
                            ...f,
                            "Residence": schoolData.SchoolAddress || f.Residence || "",
                            "City": schoolData.SchoolCity || f.City || ""
                          }));
                          toast.success("Teacher address pre-filled from selected school!");
                        }
                      })
                      .catch(err => {
                        console.error("Failed to fetch school details for auto-fill:", err);
                      });
                  }
                }
              };

              let displayField = { ...field };
              if (activeTab === "teachers" && field.key === "SchoolID") {
                if (form["Guest"]) {
                  displayField.multiple = true;
                  displayField.label = "Linked Schools";
                } else {
                  displayField.multiple = false;
                  displayField.label = "Linked School";
                }
              }

              return (
                <div key={displayField.key} className={displayField.type === "textarea" || displayField.type === "link" ? "col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {displayField.label} {displayField.required && <span className="text-red-500">*</span>}
                  </label>

                  {displayField.type === "textarea" ? (
                    <textarea
                      value={value || ""}
                      onChange={(e) => onChange(e.target.value)}
                      required={displayField.required}
                      rows={3}
                      placeholder={`Enter ${displayField.label.toLowerCase()}`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : displayField.type === "link" ? (
                    <RelationPicker
                      field={displayField}
                      value={value}
                      onChange={onChange}
                    />
                  ) : displayField.type === "select" ? (
                    <select
                      value={value || ""}
                      onChange={(e) => onChange(e.target.value || null)}
                      required={displayField.required}
                      className="w-full border border-gray-300 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25rem 1.25rem",
                      }}
                    >
                      <option value="">-- Select Option --</option>
                      {displayField.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : displayField.type === "boolean" ? (
                    <div className="flex items-center pt-2">
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                      <span className="ml-3 text-sm text-gray-500">{value ? "Yes" : "No"}</span>
                    </div>
                  ) : (
                    <input
                      type={displayField.type}
                      value={value === null || value === undefined ? "" : value}
                      onChange={(e) => {
                        const val = displayField.type === "number" ? (e.target.value !== "" ? Number(e.target.value) : "") : e.target.value;
                        onChange(val);
                      }}
                      required={displayField.required}
                      placeholder={`Enter ${displayField.label.toLowerCase()}`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCRMHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("schools");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateSpecimenModal, setShowCreateSpecimenModal] = useState(false);

  // Sync tab search parameter on load and history changes
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && TABS.some((t) => t.id === tab)) {
        setActiveTab(tab);
      }
    };
    handleLocationChange();
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
    setSearch("");
    setFilters({});
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  const currentTabObj = TABS.find((t) => t.id === activeTab);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["crm-hub", activeTab, page, search, filters],
    queryFn: async () => {
      const res = await api.get(currentTabObj.endpoint, {
        params: {
          page,
          size: 20,
          search: search || undefined,
          ...filters
        },
      });
      return res.data;
    },
  });

  const filterableFields = currentTabObj
    ? FIELDS_CONFIG[activeTab]?.filter(
      (f) => (f.type === "select" || f.type === "boolean") && f.filterable !== false
    ) || []
    : [];

  const records = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / 20) || 1;

  function handleSaved() {
    setEditRecord(null);
    queryClient.invalidateQueries({ queryKey: ["crm-hub"] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const apiCalls = API_CALLS[activeTab];
      await apiCalls.delete(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["crm-hub"] });
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to delete record.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function renderCellValue(val, colKey, row = {}) {
    if (val === null || val === undefined || val === "") return <span className="text-gray-300">—</span>;

    if (colKey === "IdCardUrl") {
      const imageUrl = String(val);
      return (
        <div className="mt-1">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Teacher ID Card Photo:</span>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block border border-gray-200 rounded p-1 bg-white hover:border-blue-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={imageUrl} alt="ID Card" className="max-w-xs max-h-48 object-contain rounded" />
            <span className="text-xs text-blue-600 hover:text-blue-800 hover:underline block mt-1 text-center font-semibold">View Full Image</span>
          </a>
        </div>
      );
    }

    if (colKey === "Notes" || colKey === "Feedback/Notes") {
      const strVal = String(val);
      const imgMatch = strVal.match(/https?:\/\/[^\s;|,]+\.(?:png|jpg|jpeg|gif|webp)/i) || strVal.match(/IdCardUrl:\s*(https?:\/\/[^\s;|,]+)/i);
      const imageUrl = row.IdCardUrl || (imgMatch ? imgMatch[1] || imgMatch[0] : null);

      if (imageUrl && !row.IdCardUrl) {
        // Clean up system-generated metadata from text representation (legacy records only)
        let cleanedVal = strVal
          .replace(/Website signup as\s+[^.|]+/i, "")
          .replace(/School:\s*[^|;.]+/i, "")
          .replace(/Status:\s*[^|;.]+/i, "")
          .replace(/IdCardUrl:\s*[^\s|;.]+/i, "")
          .replace(/[|;.\s,-]+/g, " ")
          .trim();

        return (
          <div className="flex flex-col gap-2">
            {cleanedVal ? (
              <span className="whitespace-pre-wrap">{cleanedVal}</span>
            ) : (
              <span className="text-gray-300">—</span>
            )}
            <div className="mt-1">
              <span className="text-xs font-semibold text-gray-500 block mb-1">Teacher ID Card Photo:</span>
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block border border-gray-200 rounded p-1 bg-white hover:border-blue-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={imageUrl} alt="ID Card" className="max-w-xs max-h-48 object-contain rounded" />
                <span className="text-xs text-blue-600 hover:text-blue-800 hover:underline block mt-1 text-center font-semibold">View Full Image</span>
              </a>
            </div>
          </div>
        );
      }
    }

    if (colKey === "DeliveryStatus") {
      const strVal = typeof val === "object" && val !== null ? val.value : String(val || "");
      if (strVal === "Dispatched" || strVal === "Approved") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Dispatched
          </span>
        );
      }
      if (strVal === "Not dispatched") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            ⏳ Not dispatched
          </span>
        );
      }
      if (strVal === "RTO" || strVal === "Rejected") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            ✕ Rejected
          </span>
        );
      }
      if (strVal === "Delivered") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            ✓ Delivered
          </span>
        );
      }
    }

    if (colKey === "Status") {
      const strVal = String(val);
      if (strVal === "Approved") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ Approved
          </span>
        );
      }
      if (strVal === "Pending Approval") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            ⏳ Pending Approval
          </span>
        );
      }
      if (strVal === "Rejected") {
        return (
          <span className="inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            ✕ Rejected
          </span>
        );
      }
    }

    if (colKey === "IdCardUrl") {
      const strVal = String(val);
      if (strVal.startsWith("http")) {
        return (
          <a
            href={strVal}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={strVal} alt="ID Card" className="w-7 h-7 object-cover rounded border border-gray-200" />
            View Photo
          </a>
        );
      }
    }

    if (typeof val === "boolean") {
      if (colKey === "Guest") {
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val ? "bg-purple-100 text-purple-800 border border-purple-200" : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}>
            {val ? "Guest" : "Regular"}
          </span>
        );
      }
      if (colKey === "Ordered") {
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val ? "bg-green-100 text-green-800 border border-green-200" : "bg-slate-100 text-slate-800 border border-slate-200"
            }`}>
            {val ? "Yes" : "No"}
          </span>
        );
      }
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${val ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-rose-100 text-rose-800 border border-rose-200"
          }`}>
          {val ? "Active" : "Inactive"}
        </span>
      );
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-300">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {typeof item === "object" ? item.value || item.id : String(item)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof val === "object") {
      return <span className="text-xs font-mono text-blue-600 font-semibold">{val.value || val.id || JSON.stringify(val)}</span>;
    }
    return String(val);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-0">CRM Database</h2>

      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">

          {/* Top Actions / Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex overflow-x-auto gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm cursor-pointer ${isActive
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {currentTabObj?.baserowUrl && (
              <a
                href={currentTabObj.baserowUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-gray-900 hover:bg-gray-800 text-white text-sm cursor-pointer ml-auto"
              >
                Open Baserow UI <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            )}
          </div>

          {/* Table Card matching Products exactly */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">

            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">All {currentTabObj.label}</h2>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                  {/* Dynamic Dropdown Filters */}
                  {filterableFields.map((field) => (
                    <select
                      key={field.key}
                      value={filters[field.key] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFilters((prev) => {
                          const next = { ...prev };
                          if (val === "") {
                            delete next[field.key];
                          } else {
                            next[field.key] = val;
                          }
                          return next;
                        });
                        setPage(1);
                      }}
                      className="border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer text-gray-700 font-medium appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25rem 1.25rem",
                      }}
                    >
                      <option value="">Filter by {field.label}</option>
                      {field.type === "boolean" ? (
                        <>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </>
                      ) : (
                        field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))
                      )}
                    </select>
                  ))}

                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
                    <input
                      type="text"
                      placeholder={`Search ${currentTabObj.label.toLowerCase()}...`}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-80 text-sm"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => {
                      if (activeTab === "specimen") {
                        setShowCreateSpecimenModal(true);
                      } else {
                        setEditRecord({});
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {currentTabObj.singularLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-16">S.No</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    {(TABLE_COLUMNS[activeTab] || []).map((colKey) => (
                      <th key={colKey} className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {colKey.replace(/_/g, " ")}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-4"><div className="h-4 w-6 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-5 w-12 bg-gray-200 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={(TABLE_COLUMNS[activeTab] || []).length + 3} className="px-6 py-16 text-center text-gray-400 text-sm">
                        No records found in this table.
                      </td>
                    </tr>
                  ) : (
                    records.map((row, index) => {
                      const sno = (page - 1) * 20 + index + 1;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedRecord(row)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-gray-500">
                            {sno}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                            #{row.id}
                          </td>
                          {(TABLE_COLUMNS[activeTab] || []).map((colKey) => (
                            <td key={colKey} className="px-6 py-4 text-sm text-gray-900 max-w-[240px] truncate">
                              {renderCellValue(row[colKey], colKey, row)}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end items-center space-x-2">
                              {activeTab === "teachers" && row.Status !== "Approved" && row.Status !== "Rejected" && (
                                <>
                                  <button
                                    onClick={async () => {
                                      setActionLoading((prev) => ({ ...prev, [row.id]: "approve" }));
                                      try {
                                        await api.patch(`/api/crm/teachers/${row.id}/approve`);
                                        refetch();
                                      } catch (err) {
                                        alert(err?.response?.data?.detail || "Failed to approve teacher");
                                      } finally {
                                        setActionLoading((prev) => ({ ...prev, [row.id]: null }));
                                      }
                                    }}
                                    disabled={!!actionLoading[row.id]}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                                    title="Approve Teacher"
                                  >
                                    {actionLoading[row.id] === "approve" ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Approving...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Approve</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Are you sure you want to reject this teacher registration?")) return;
                                      setActionLoading((prev) => ({ ...prev, [row.id]: "reject" }));
                                      try {
                                        await api.patch(`/api/crm/teachers/${row.id}/reject`);
                                        refetch();
                                      } catch (err) {
                                        alert(err?.response?.data?.detail || "Failed to reject teacher");
                                      } finally {
                                        setActionLoading((prev) => ({ ...prev, [row.id]: null }));
                                      }
                                    }}
                                    disabled={!!actionLoading[row.id]}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                                    title="Reject Teacher"
                                  >
                                    {actionLoading[row.id] === "reject" ? (
                                      <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Rejecting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Reject</span>
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                              {activeTab === "specimen" && (() => {
                                const statusStr = typeof row.DeliveryStatus === "object" && row.DeliveryStatus !== null ? row.DeliveryStatus.value : String(row.DeliveryStatus || "");
                                const isOldData = Number(row.id) <= 363;
                                const isPending = !isOldData && statusStr !== "Dispatched" && statusStr !== "Approved" && statusStr !== "RTO" && statusStr !== "Rejected" && statusStr !== "Delivered";

                                if (isOldData) {
                                  return (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                      Old Data
                                    </span>
                                  );
                                }

                                return isPending ? (
                                  <>
                                    <button
                                      onClick={async () => {
                                        setActionLoading((prev) => ({ ...prev, [row.id]: "approve" }));
                                        try {
                                          await api.patch(`/api/specimen-requests/${row.id}/approve`);
                                          toast.success(`Specimen Request Approved! Created Order #SPEC-${row.id}`);
                                          refetch();
                                        } catch (err) {
                                          alert(err?.response?.data?.detail || "Failed to approve specimen request");
                                        } finally {
                                          setActionLoading((prev) => ({ ...prev, [row.id]: null }));
                                        }
                                      }}
                                      disabled={!!actionLoading[row.id]}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                                      title="Approve Specimen Request & Create Order"
                                    >
                                      {actionLoading[row.id] === "approve" ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Approving...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                          <span>Approve</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (!confirm("Are you sure you want to reject this specimen request?")) return;
                                        setActionLoading((prev) => ({ ...prev, [row.id]: "reject" }));
                                        try {
                                          await api.patch(`/api/specimen-requests/${row.id}/reject`);
                                          toast.success("Specimen request rejected.");
                                          refetch();
                                        } catch (err) {
                                          alert(err?.response?.data?.detail || "Failed to reject specimen request");
                                        } finally {
                                          setActionLoading((prev) => ({ ...prev, [row.id]: null }));
                                        }
                                      }}
                                      disabled={!!actionLoading[row.id]}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                                      title="Reject Specimen Request"
                                    >
                                      {actionLoading[row.id] === "reject" ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Rejecting...</span>
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                          <span>Reject</span>
                                        </>
                                      )}
                                    </button>
                                  </>
                                ) : null;
                              })()}
                              <button
                                onClick={() => setSelectedRecord(row)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Inspect Record"
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setEditRecord(row)}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Record"
                              >
                                <Pen className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(row)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span> &mdash; {count.toLocaleString()} records
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Record Details #{selectedRecord.id}</h2>
                <p className="text-xs text-gray-500 capitalize mt-0.5">Table: {currentTabObj.label}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedRecord).map(([k, v]) => {
                  // Helper: is this value a linked-record object { id, value }?
                  const isLinkObj = (x) => x && typeof x === "object" && !Array.isArray(x) && "id" in x && "value" in x;
                  const isLinkedArray = Array.isArray(v) && v.length > 0 && v.every(isLinkObj);
                  const isLinkedSingle = !Array.isArray(v) && isLinkObj(v);
                  const isLinkField = isLinkedArray || isLinkedSingle;

                  // Determine target tab: explicit config first, then field-name heuristics
                  const fieldConfig = FIELDS_CONFIG[activeTab]?.find(f => f.key === k);
                  let targetTab = fieldConfig?.type === "link" ? fieldConfig.targetTab : null;
                  if (!targetTab && isLinkField) {
                    const kl = k.toLowerCase();
                    if (kl.includes("teacher")) targetTab = "teachers";
                    else if (kl.includes("school")) targetTab = "schools";
                    else if (kl.includes("book") || kl.includes("category")) targetTab = "books";
                    else if (kl.includes("subject")) targetTab = "subjects";
                    else if (kl.includes("specimen")) targetTab = "specimen";
                  }

                  const openLinkedRecord = (item) => {
                    if (!targetTab) return;
                    handleTabChange(targetTab);
                    setSelectedRecord(null);
                    const ep = (TABS.find(t => t.id === targetTab)?.endpoint || "").replace(/\/$/, "");
                    api.get(`${ep}/${item.id}`)
                      .then(res => {
                        if (res.data) setSelectedRecord(res.data);
                        else toast.error("Linked record not found.");
                      })
                      .catch(() => toast.error("Could not load linked record."));
                  };

                  const renderValue = () => {
                    if (v === null || v === undefined) return <span className="text-gray-300">—</span>;
                    if (isLinkField) {
                      const items = Array.isArray(v) ? v : [v];
                      if (items.length === 0) return <span className="text-gray-300">—</span>;
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {items.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openLinkedRecord(item)}
                              disabled={!targetTab}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                targetTab
                                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-400 cursor-pointer"
                                  : "bg-gray-100 text-gray-500 border-gray-200 cursor-default"
                              }`}
                            >
                              {item.value || `#${item.id}`}
                              {targetTab && <ExternalLink className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return renderCellValue(v, k, selectedRecord);
                  };

                  return (
                    <div key={k} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</dt>
                      <dd className="text-sm font-semibold text-gray-900 break-words">
                        {renderValue()}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Record Form Modal (Create/Edit) */}
      {editRecord && (
        <CRMFormModal
          activeTab={activeTab}
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Create Specimen Modal */}
      {showCreateSpecimenModal && (
        <CreateSpecimenModal
          onClose={() => setShowCreateSpecimenModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["crm-hub"] });
            refetch();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmModal
          title={`Delete ${currentTabObj.label}`}
          message={`Are you sure you want to delete this ${currentTabObj.label.toLowerCase()} record? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
