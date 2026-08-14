"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Users
} from "lucide-react";

const PAGE_SIZE = 20;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function RoleBadge({ role }) {
  const map = {
    admin: "bg-purple-50 text-purple-700 border-purple-100",
    superadmin: "bg-rose-50 text-rose-700 border-rose-100",
    staff: "bg-blue-50 text-blue-700 border-blue-100",
    user: "bg-gray-50 text-gray-700 border-gray-200",
    customer: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const cls = map[role?.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${cls}`}>
      {role || "—"}
    </span>
  );
}

const COLS = ["ID", "Email", "Phone", "Display Name", "Username", "Role", "Confirmed At", "Last Sign In"];

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const { data } = await api.get("/api/users/", { params });
      return data;
    },
  });

  const users = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? 0;
  const totalPages = Math.ceil(count / PAGE_SIZE);

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Users</h1>
            <span className="bg-red-50 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
              {count.toLocaleString()} Registered
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage user account permissions, search profile credentials, review sign-in activity logs.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_4px_20px_rgb(0,0,0,0.015)] flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search users by email, name or username..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all text-gray-900" 
          />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {search && (
          <button 
            onClick={() => setSearch("")} 
            className="text-xs font-bold text-red-600 hover:text-red-750 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* Grid List Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-[0_4px_25px_rgb(0,0,0,0.015)] overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLS.map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 animate-pulse bg-white">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-gray-200 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-gray-200 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-500">No user accounts found.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {COLS.map((h) => (
                    <th key={h} className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* ID */}
                    <td className="px-5 py-4 text-xs font-semibold text-gray-500">
                      #{user.id}
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {user.email || "—"}
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className="text-purple-600 hover:text-purple-800 hover:underline font-medium">
                          {user.phone}
                        </a>
                      ) : "—"}
                    </td>

                    {/* Display Name */}
                    <td className="px-5 py-4 text-xs font-medium text-gray-900 whitespace-nowrap">
                      {user.display_name ?? user.full_name ?? "—"}
                    </td>

                    {/* Username */}
                    <td className="px-5 py-4 text-xs text-gray-500 font-medium whitespace-nowrap">
                      {user.username ?? "—"}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Confirmed At */}
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(user.confirmed_at)}
                    </td>

                    {/* Last Sign In */}
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(user.last_sign_in_at ?? user.last_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.email || "—"}</p>
                    <p className="text-xs text-gray-600">{user.display_name ?? user.full_name ?? "—"}</p>
                    {user.phone && <p className="text-xs text-purple-600 font-medium">{user.phone}</p>}
                    {user.username && <p className="text-xs text-gray-400">{user.username}</p>}
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                  <span>#{user.id}</span>
                  <span>Joined: {formatDate(user.confirmed_at)}</span>
                  {(user.last_sign_in_at ?? user.last_login) && <span>Last: {formatDate(user.last_sign_in_at ?? user.last_login)}</span>}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-2">
          <p className="text-xs font-semibold text-gray-500">
            Page <span className="text-gray-900 font-bold">{page}</span> of <span className="text-gray-900 font-bold">{totalPages}</span> &mdash; {count.toLocaleString()} users
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage((p) => Math.max(1, p - 1))} 
              disabled={page === 1} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-xl text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages} 
              className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 bg-white rounded-xl text-xs font-semibold text-gray-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
