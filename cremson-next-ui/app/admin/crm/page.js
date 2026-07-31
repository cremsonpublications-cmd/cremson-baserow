"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  BookMarked,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

const TABS = [
  { id: "schools", label: "Schools", icon: Building2, endpoint: "/api/crm/schools" },
  { id: "teachers", label: "Teachers", icon: GraduationCap, endpoint: "/api/crm/teachers" },
  { id: "specimen", label: "Specimen Requests", icon: FileText, endpoint: "/api/specimen-requests/" },
  { id: "books", label: "CRM Books Catalog", icon: BookOpen, endpoint: "/api/crm/books" },
  { id: "subjects", label: "Subjects", icon: BookMarked, endpoint: "/api/crm/subjects" },
];

export default function AdminCRMHub() {
  const [activeTab, setActiveTab] = useState("schools");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const currentTabObj = TABS.find((t) => t.id === activeTab);

  const { data, isLoading } = useQuery({
    queryKey: ["crm-hub", activeTab, page, search],
    queryFn: async () => {
      const res = await api.get(currentTabObj.endpoint, {
        params: { page, size: 25, search: search || undefined },
      });
      return res.data;
    },
  });

  const records = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / 25) || 1;

  function renderCellValue(val) {
    if (val === null || val === undefined) return <span className="text-slate-300">—</span>;
    if (typeof val === "boolean") {
      return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          {val ? "Active" : "Inactive"}
        </span>
      );
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-300">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
              {typeof item === "object" ? item.value || item.id : String(item)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof val === "object") {
      return <span className="text-xs font-mono text-purple-600 font-semibold">{val.value || val.id || JSON.stringify(val)}</span>;
    }
    return String(val);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Baserow CRM Database Hub</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full border border-purple-200">
              Self-Hosted Live Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse and inspect full relational Baserow CRM tables synced directly with your self-hosted server (http://200.141.5.200).
          </p>
        </div>

        {/* Direct Link to Self-Hosted Baserow */}
        <a
          href="http://200.141.5.200"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          Open Baserow UI <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100/70 border border-slate-200/60 rounded-2xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
                setSearch("");
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-purple-700 shadow-sm border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${currentTabObj.label}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-slate-900"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-slate-900 font-extrabold">{records.length}</span> of {count.toLocaleString()} records
        </div>
      </div>

      {/* Records Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading {currentTabObj.label} from Baserow...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
                  {Object.keys(records[0] || {})
                    .filter((k) => k !== "id" && k !== "order")
                    .slice(0, 7)
                    .map((colKey) => (
                      <th key={colKey} className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {colKey.replace(/_/g, " ")}
                      </th>
                    ))}
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs font-medium text-slate-700">
                {records.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRecord(row)}
                    className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-bold font-mono text-purple-700">#{row.id}</td>
                    {Object.keys(row)
                      .filter((k) => k !== "id" && k !== "order")
                      .slice(0, 7)
                      .map((colKey) => (
                        <td key={colKey} className="px-4 py-3.5 max-w-[200px] truncate">
                          {renderCellValue(row[colKey])}
                        </td>
                      ))}
                    <td className="px-4 py-3.5 text-right font-bold text-purple-600 hover:text-purple-800">
                      View Details &rarr;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-slate-500">
            Page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Next <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Inspection #{selectedRecord.id}</h2>
                <p className="text-xs text-slate-400 capitalize">Table: {currentTabObj.label}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedRecord).map(([k, v]) => (
                  <div key={k} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</dt>
                    <dd className="text-xs font-semibold text-slate-800 break-words">
                      {renderCellValue(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
