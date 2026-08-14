"use client";
 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { toast } from "sonner";
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Plus,
  Pen,
  Trash2,
  Lock,
  Loader2,
  Check
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

const COLS = ["ID", "Email", "Phone", "Display Name", "Username", "Role", "Confirmed At", "Last Sign In", "Actions"];

const PERMISSION_OPTIONS = [
  { key: "products", label: "Manage Products", description: "Create and edit books, courses, categories" },
  { key: "orders", label: "Manage Orders", description: "Process customer bulk/school orders & specimens" },
  { key: "crm", label: "Manage CRM", description: "View and approve schools/teachers, edit details" },
  { key: "users", label: "Manage Administrative Users", description: "Add/edit administrative accounts and permissions" },
  { key: "blogs", label: "Manage Blogs & Reviews", description: "Write blog posts, edit reviews and banners" },
  { key: "settings", label: "Manage System Settings", description: "Configure pricing, shipping rates, and signup limits" },
];

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Modal and Edit user states
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submittingError, setSubmittingError] = useState("");
  const [showFormPassword, setShowFormPassword] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // user to delete
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  // Admin-only guard: redirect staff users who land here directly via URL
  useEffect(() => {
    const token = typeof window !== "undefined" && localStorage.getItem("cremson_admin_token");
    if (!token) { router.replace("/admin/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = (payload.role || "").toLowerCase();
      if (role !== "admin" && role !== "superadmin") {
        toast.error("Access Denied: Only the main administrator can manage users.");
        router.replace("/admin");
      }
    } catch {
      router.replace("/admin/login");
    }
  }, []);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const params = { page, size: PAGE_SIZE };
  if (debouncedSearch) params.search = debouncedSearch;

  const { data, isLoading, refetch } = useQuery({
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
        <button
          onClick={() => {
            setEditUser(null);
            setName("");
            setEmail("");
            setPhone("");
            setPassword("");
            setRole("staff");
            setSelectedPermissions([]);
            setSubmittingError("");
            setShowFormPassword(true);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Admin/Staff User
        </button>
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

                    {/* Actions */}
                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditUser(user);
                            setName(user.display_name || user.full_name || "");
                            setEmail(user.email || "");
                            setPhone(user.phone || "");
                            setPassword("");
                            setRole(user.role || "staff");
                            const perms = [];
                            if (user.permissions?.includes("products:write")) perms.push("products");
                            if (user.permissions?.includes("orders:write")) perms.push("orders");
                            if (user.permissions?.includes("crm:write")) perms.push("crm");
                            if (user.permissions?.includes("users:write")) perms.push("users");
                            if (user.permissions?.includes("blogs:write")) perms.push("blogs");
                            if (user.permissions?.includes("settings:write")) perms.push("settings");
                            setSelectedPermissions(perms);
                            setSubmittingError("");
                            setShowModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Permissions & Profile"
                        >
                          <Pen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                  <div className="flex flex-col items-end gap-2">
                    <RoleBadge role={user.role} />
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setEditUser(user); setName(user.display_name || user.full_name || ""); setEmail(user.email || ""); setPhone(user.phone || ""); setPassword(user.plain_password || ""); setShowFormPassword(true); setRole(user.role || "staff"); const perms = []; if (user.permissions?.includes("products:write")) perms.push("products"); if (user.permissions?.includes("orders:write")) perms.push("orders"); if (user.permissions?.includes("crm:write")) perms.push("crm"); if (user.permissions?.includes("users:write")) perms.push("users"); if (user.permissions?.includes("blogs:write")) perms.push("blogs"); if (user.permissions?.includes("settings:write")) perms.push("settings"); setSelectedPermissions(perms); setSubmittingError(""); setShowModal(true); }} className="p-1 text-gray-400 hover:text-purple-600"><Pen className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { setDeleteTarget(user); }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                  <span>#{user.id}</span>
                  <span>Joined: {formatDate(user.confirmed_at)}</span>
                  {(user.last_sign_in_at ?? user.last_login) && <span>Last: {formatDate(user.last_sign_in_at ?? user.last_login)}</span>}
                  {user.plain_password && (
                    <span className="flex items-center gap-1 text-amber-600 font-mono font-semibold">
                      <Lock className="w-3 h-3" /> {user.plain_password}
                    </span>
                  )}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
            {/* Red header strip */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Delete User</h3>
                  <p className="text-xs text-red-100 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-1">
                Are you sure you want to permanently delete this user?
              </p>
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-gray-800">{deleteTarget.display_name || deleteTarget.full_name || deleteTarget.name || "—"}</p>
                <p className="text-xs text-gray-500">{deleteTarget.email}</p>
                {deleteTarget.phone && <p className="text-xs text-gray-400">{deleteTarget.phone}</p>}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await api.delete(`/api/users/${deleteTarget.id}`);
                      toast.success("User deleted successfully!");
                      setDeleteTarget(null);
                      refetch();
                    } catch (err) {
                      toast.error(err?.response?.data?.detail || "Failed to delete user.");
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-gray-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editUser ? "Edit User Permissions & Profile" : "Create Admin/Staff User"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure access credentials, role classification, and custom module permissions.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {submittingError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
                  {submittingError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-700">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit number"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-gray-700">
                    Password {editUser ? "(Leave blank to keep current)" : "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required={!editUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editUser ? "Enter new password" : "Min 8 chars, A-Z, 1 digit, 1 special"}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-xs font-medium text-gray-950 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showFormPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-gray-700">Role Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("staff")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      role === "staff"
                        ? "border-blue-600 bg-blue-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Staff Account</span>
                      {role === "staff" && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Restricted login. Can only perform actions allowed in permissions below.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      role === "admin"
                        ? "border-purple-600 bg-purple-50/50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Admin Account</span>
                      {role === "admin" && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Full access to administrative dashboard modules and overall system controls.
                    </p>
                  </button>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 text-left pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Module Access Permissions</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.length === PERMISSION_OPTIONS.length) {
                        setSelectedPermissions([]);
                      } else {
                        setSelectedPermissions(PERMISSION_OPTIONS.map((o) => o.key));
                      }
                    }}
                    className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer"
                  >
                    {selectedPermissions.length === PERMISSION_OPTIONS.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_OPTIONS.map((opt) => {
                    const isChecked = selectedPermissions.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSelectedPermissions((prev) =>
                            prev.includes(opt.key)
                              ? prev.filter((k) => k !== opt.key)
                              : [...prev, opt.key]
                          );
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer flex gap-3 items-start transition-all ${
                          isChecked
                            ? "border-purple-500 bg-purple-50/20"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-purple-600 border-purple-600 text-white"
                              : "border-gray-300"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || (!editUser && !password)) {
      setSubmittingError("Please fill out all required fields.");
      return;
    }
    setSaving(true);
    setSubmittingError("");

    const finalPermissions = [];
    if (selectedPermissions.includes("products")) finalPermissions.push("products:read", "products:write");
    if (selectedPermissions.includes("orders")) finalPermissions.push("orders:read", "orders:write");
    if (selectedPermissions.includes("crm")) finalPermissions.push("crm:read", "crm:write");
    if (selectedPermissions.includes("users")) finalPermissions.push("users:read", "users:write");
    if (selectedPermissions.includes("blogs")) finalPermissions.push("blogs:read", "blogs:write");
    if (selectedPermissions.includes("settings")) finalPermissions.push("settings:write");

    const payload = {
      name,
      email,
      phone,
      role,
      permissions: finalPermissions,
    };
    if (password) {
      payload.password = password;
    }

    try {
      if (editUser) {
        await api.patch(`/api/users/${editUser.id}`, payload);
        toast.success("User updated successfully!");
      } else {
        await api.post("/api/users/", payload);
        toast.success("User created successfully!");
      }
      refetch();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setSubmittingError(err?.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  }
}
