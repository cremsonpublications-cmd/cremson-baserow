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
  ChevronDown,
  Eye
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
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          val ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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
    <div className="lg:p-8">
      {/* Page Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 mt-[20px] sm:mt-0">CRM Database</h2>

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
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                      setSearch("");
                    }}
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm cursor-pointer ${
                      isActive
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

            <a
              href="http://200.141.5.200"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 bg-gray-900 hover:bg-gray-800 text-white text-sm cursor-pointer ml-auto"
            >
              Open Baserow UI <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>

          {/* Table Card matching Products exactly */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">All {currentTabObj.label}</h2>
                
                <div className="flex items-center gap-3 flex-wrap justify-end">
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
                    {Object.keys(records[0] || {})
                      .filter((k) => k !== "id" && k !== "order")
                      .slice(0, 5)
                      .map((colKey) => (
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
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
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
                          {Object.keys(row)
                            .filter((k) => k !== "id" && k !== "order")
                            .slice(0, 5)
                            .map((colKey) => (
                              <td key={colKey} className="px-6 py-4 text-sm text-gray-900 max-w-[240px] truncate">
                                {renderCellValue(row[colKey])}
                              </td>
                            ))}
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setSelectedRecord(row)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Inspect Record"
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
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
