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
  ChevronDown
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
        params: { page, size: 20, search: search || undefined },
      });
      return res.data;
    },
  });

  const records = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / 20) || 1;

  function renderCellValue(val) {
    if (val === null || val === undefined) return <span className="text-gray-300">—</span>;
    if (typeof val === "boolean") {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          val ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
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
            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
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
    <div className="space-y-6 text-left">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Database Hub</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and inspect full relational Baserow CRM tables synced directly with your self-hosted server.
          </p>
        </div>

        <a
          href="http://200.141.5.200"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Open Baserow UI <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600 border border-blue-200 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Card matching Admin Products */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {/* Card Header & Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All {currentTabObj.label}
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${currentTabObj.label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
                Showing <span className="text-gray-900 font-bold">{records.length}</span> of {count.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-500">Loading records from Baserow...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">No records found in this table</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                  {Object.keys(records[0] || {})
                    .filter((k) => k !== "id" && k !== "order")
                    .slice(0, 6)
                    .map((colKey) => (
                      <th key={colKey} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {colKey.replace(/_/g, " ")}
                      </th>
                    ))}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-sm text-gray-700">
                {records.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRecord(row)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold font-mono text-gray-900">#{row.id}</td>
                    {Object.keys(row)
                      .filter((k) => k !== "id" && k !== "order")
                      .slice(0, 6)
                      .map((colKey) => (
                        <td key={colKey} className="px-6 py-4 max-w-[220px] truncate">
                          {renderCellValue(row[colKey])}
                        </td>
                      ))}
                    <td className="px-6 py-4 text-right font-medium text-blue-600 hover:text-blue-800">
                      Inspect &rarr;
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Footer / Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-white">
            <p className="text-xs text-gray-500 font-medium">
              Page <span className="text-gray-900 font-bold">{page}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Record Inspection #{selectedRecord.id}</h2>
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
                {Object.entries(selectedRecord).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</dt>
                    <dd className="text-sm font-semibold text-gray-900 break-words">
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
