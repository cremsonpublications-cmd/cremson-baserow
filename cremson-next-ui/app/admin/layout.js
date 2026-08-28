"use client";

import Link from "next/link";
import CPLogo from "../../components/CPLogo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/api/axios";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Ticket,
  ShoppingCart,
  FileText,
  MessageSquare,
  Settings,
  X,
  Menu,
  LogOut,
  Home,
  Database,
  Users,
  BookOpen,
  Newspaper,
  ChevronDown,
  ChevronRight,
  UploadCloud,
  Shield,
  Bell,
  Send,
} from "lucide-react";

const coreLinks = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart, badgeKey: "orders" },
  { href: "/admin/whatsapp/campaigns", label: "WhatsApp Campaigns", Icon: Send },
  { href: "/admin/whatsapp/templates", label: "WhatsApp Templates", Icon: FileText },
  { href: "/admin/bulk-orders", label: "Bulk Orders", Icon: Package, badgeKey: "bulkOrders" },
  { href: "/admin/specimen-requests", label: "Specimen Requests", Icon: FileText, badgeKey: "specimenRequests" },
  { href: "/admin/specimen-books", label: "Specimen Books", Icon: BookOpen },
  { href: "/admin/crm?tab=schools", label: "CRM Database Hub", Icon: Database },
  { href: "/admin/support-tickets", label: "Support & Enquiries", Icon: MessageSquare },
  { href: "/admin/reminders", label: "Reminders", Icon: Bell, badgeKey: "reminders" },
];

const adminLinks = [
  { href: "/admin/categories", label: "Categories", Icon: FolderOpen },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/coupons", label: "Coupons", Icon: Ticket },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/banners", label: "Banner Images", Icon: LayoutDashboard },
  { href: "/admin/settings", label: "General Settings", Icon: Settings },
];

const uploadLinks = [
  { href: "/admin/blogs", label: "Blogs Dashboard", Icon: LayoutDashboard },
  { href: "/admin/addBlog", label: "Add Blog", Icon: Newspaper },
  { href: "/admin/listBlog", label: "Blog List", Icon: FileText },
  { href: "/admin/comments", label: "Blog Comments", Icon: MessageSquare },
  { href: "/admin/teaching-resources", label: "Teaching Resources", Icon: BookOpen },
  { href: "/admin/teaching-resource-posts", label: "Teaching Resource Pages", Icon: FileText },
  { href: "/admin/study-materials", label: "Study Materials", Icon: BookOpen },
  { href: "/admin/study-material-posts", label: "Study Material Pages", Icon: FileText },
  { href: "/admin/reviews", label: "Reviews", Icon: MessageSquare },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [uploadExpanded, setUploadExpanded] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserLoading, setCurrentUserLoading] = useState(true);

  const [badgeCounts, setBadgeCounts] = useState({
    orders: 0,
    bulkOrders: 0,
    specimenRequests: 0,
    reminders: 0,
  });

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!checked || isLoginPage) {
      setCurrentUserLoading(false);
      return;
    }
    setCurrentUserLoading(true);
    api.get("/api/auth/me")
      .then(res => {
        setCurrentUser(res.data);
      })
      .catch(err => {
        console.error("Failed to load user info:", err);
      })
      .finally(() => {
        setCurrentUserLoading(false);
      });
  }, [checked, isLoginPage]);

  function hasPermissionForLink(href) {
    if (isLoginPage) return true;
    if (!currentUser) {
      // While loading profile, allow access
      return true;
    }
    const role = currentUser.role?.toLowerCase();
    if (role === "superadmin" || role === "admin") return true;

    const userPerms = currentUser.permissions || [];

    if (href.startsWith("/admin/orders") || href.startsWith("/admin/bulk-orders") || href.startsWith("/admin/specimen-requests") || href.startsWith("/admin/reminders") || href.startsWith("/admin/specimen-books")) {
      return userPerms.includes("orders:write") || userPerms.includes("orders:read");
    }
    if (href.startsWith("/admin/crm")) {
      return userPerms.includes("crm:write") || userPerms.includes("crm:read");
    }
    if (href.startsWith("/admin/categories") || href.startsWith("/admin/products")) {
      return userPerms.includes("products:write") || userPerms.includes("products:read");
    }
    if (href.startsWith("/admin/users")) {
      // Users page: only the main admin can see/access this
      return role === "superadmin" || role === "admin";
    }
    if (href.startsWith("/admin/settings")) {
      return userPerms.includes("settings:write");
    }
    if (
      href.startsWith("/admin/blogs") || 
      href.startsWith("/admin/addBlog") || 
      href.startsWith("/admin/listBlog") || 
      href.startsWith("/admin/comments") || 
      href.startsWith("/admin/teaching-resources") || 
      href.startsWith("/admin/teaching-resource-posts") || 
      href.startsWith("/admin/study-materials") || 
      href.startsWith("/admin/study-material-posts") || 
      href.startsWith("/admin/reviews") || 
      href.startsWith("/admin/banners") || 
      href.startsWith("/admin/coupons")
    ) {
      return userPerms.includes("blogs:write") || userPerms.includes("blogs:read");
    }
    return true;
  }

  useEffect(() => {
    if (isLoginPage) { setChecked(true); return; }
    const token = typeof window !== "undefined" && localStorage.getItem("cremson_admin_token");
    if (!token) { router.replace("/admin/login"); } else { setChecked(true); }
  }, [isLoginPage, router]);

  // Fetch pending counts for notification badges
  useEffect(() => {
    if (!checked || isLoginPage) return;
    let mounted = true;

    async function fetchBadgeCounts() {
      try {
        const [ordersRes, bulkRes, specimenRes, remindersRes] = await Promise.allSettled([
          api.get("/api/orders/?size=200"),
          api.get("/api/bulk-orders/?size=200"),
          api.get("/api/specimen-requests/?size=200"),
          api.get("/api/reminders/?status=pending"),
        ]);

        let ordersCount = 0;
        if (ordersRes.status === "fulfilled" && ordersRes.value.data) {
          const items = ordersRes.value.data.results || ordersRes.value.data.items || ordersRes.value.data || [];
          ordersCount = items.filter(
            (o) => (o.order_status || o.status || "").toLowerCase() === "ready_to_pack"
          ).length;
        }

        let bulkCount = 0;
        if (bulkRes.status === "fulfilled" && bulkRes.value.data) {
          const items = Array.isArray(bulkRes.value.data.results)
            ? bulkRes.value.data.results
            : Array.isArray(bulkRes.value.data)
            ? bulkRes.value.data
            : [];
          bulkCount = items.filter((o) => {
            const st = (o.status || "").toLowerCase();
            return st === "pending" || st === "pending_approval" || st === "created";
          }).length;
        }

        let specimenCount = 0;
        if (specimenRes.status === "fulfilled" && specimenRes.value.data) {
          const items = Array.isArray(specimenRes.value.data)
            ? specimenRes.value.data
            : specimenRes.value.data.results || specimenRes.value.data.items || [];
          specimenCount = items.filter(
            (s) => (s.status || "").toLowerCase() === "pending"
          ).length;
        }

        let remindersCount = 0;
        if (remindersRes.status === "fulfilled" && remindersRes.value.data) {
          const items = Array.isArray(remindersRes.value.data.reminders)
            ? remindersRes.value.data.reminders
            : [];
          remindersCount = items.filter((r) => r.is_overdue || r.is_today).length;
        }

        if (mounted) {
          setBadgeCounts({
            orders: ordersCount,
            bulkOrders: bulkCount,
            specimenRequests: specimenCount,
            reminders: remindersCount,
          });
        }
      } catch (err) {
        console.error("Failed to fetch badge counts:", err);
      }
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checked, isLoginPage]);

  function handleLogout() {
    localStorage.removeItem("cremson_admin_token");
    router.replace("/admin/login");
  }

  function isActive(href) {
    const cleanHref = href.split("?")[0];
    if (cleanHref === "/admin") return pathname === "/admin";
    return pathname.startsWith(cleanHref);
  }

  useEffect(() => {
    if (adminLinks.some(link => isActive(link.href))) {
      setAdminExpanded(true);
    }
    if (uploadLinks.some(link => isActive(link.href))) {
      setUploadExpanded(true);
    }
  }, [pathname]);

  const currentRole = (currentUser?.role || "").toLowerCase();
  const isMainAdmin = currentRole === "admin" || currentRole === "superadmin";

  const visibleCoreLinks = coreLinks.filter(({ href }) => hasPermissionForLink(href));
  // Admin links: always show Users link but mark it disabled if not main admin
  const visibleAdminLinks = adminLinks
    .filter(({ href }) => href === "/admin/users" ? true : hasPermissionForLink(href))
    .map(link => ({
      ...link,
      disabled: link.href === "/admin/users" && !isMainAdmin,
    }));
  const visibleUploadLinks = uploadLinks.filter(({ href }) => hasPermissionForLink(href));

  if (isLoginPage) return <>{children}</>;

  if (!checked || (currentUserLoading && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAllowed = hasPermissionForLink(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-screen lg:z-auto flex-shrink-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CPLogo className="h-10 w-auto" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {/* Core Links */}
            {visibleCoreLinks.map(({ href, label, Icon, badgeKey }) => {
              const active = isActive(href);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors text-sm
                      ${active
                        ? "bg-red-50 text-red-700 border border-red-200 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-transparent"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={20} aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}

            {/* Admin collapsible section */}
            {visibleAdminLinks.length > 0 && (
              <li>
                <button
                  onClick={() => setAdminExpanded(!adminExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors
                    ${visibleAdminLinks.some(link => isActive(link.href))
                      ? "text-red-700 bg-red-50/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <Shield size={20} className={visibleAdminLinks.some(link => isActive(link.href)) ? "text-red-700" : "text-gray-500"} />
                    <span>Admin</span>
                  </div>
                  {adminExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {adminExpanded && (
                  <ul className="ml-6 pl-3 border-l border-gray-200 space-y-1 mt-1">
                    {visibleAdminLinks.map(({ href, label, Icon, disabled }) => {
                      const active = isActive(href);
                      if (disabled) {
                        return (
                          <li key={href} title="Only the main administrator can manage users">
                            <span
                              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm font-medium text-gray-300 cursor-not-allowed select-none"
                              aria-disabled="true"
                            >
                              <Icon size={16} aria-hidden="true" className="text-gray-300" />
                              <span>{label}</span>
                              <Lock size={12} className="ml-auto text-gray-300" />
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={() => setSidebarOpen(false)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm
                              ${active
                                ? "bg-red-50 text-red-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                              }`}
                          >
                            <Icon size={16} aria-hidden="true" />
                            <span>{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}

            {/* Upload collapsible section */}
            {visibleUploadLinks.length > 0 && (
              <li>
                <button
                  onClick={() => setUploadExpanded(!uploadExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors
                    ${visibleUploadLinks.some(link => isActive(link.href))
                      ? "text-red-700 bg-red-50/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <UploadCloud size={20} className={visibleUploadLinks.some(link => isActive(link.href)) ? "text-red-700" : "text-gray-500"} />
                    <span>Upload</span>
                  </div>
                  {uploadExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {uploadExpanded && (
                  <ul className="ml-6 pl-3 border-l border-gray-200 space-y-1 mt-1">
                    {visibleUploadLinks.map(({ href, label, Icon }) => {
                      const active = isActive(href);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={() => setSidebarOpen(false)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm
                              ${active
                                ? "bg-red-50 text-red-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                              }`}
                          >
                            <Icon size={16} aria-hidden="true" />
                            <span>{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Home size={18} />
            <span>Storefront</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden">

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <CPLogo className="h-8 w-auto" />
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {isAllowed ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-6 space-y-4">
              <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Access Denied</h2>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                You do not have the required permissions to view this section. Please contact your system administrator if you believe this is an error.
              </p>
              <button
                onClick={() => router.replace("/admin")}
                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow-md text-xs transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
