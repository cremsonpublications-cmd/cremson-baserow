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
} from "lucide-react";

const coreLinks = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart, badgeKey: "orders" },
  { href: "/admin/bulk-orders", label: "Bulk Orders", Icon: Package, badgeKey: "bulkOrders" },
  { href: "/admin/specimen-requests", label: "Specimen Requests", Icon: FileText, badgeKey: "specimenRequests" },
  { href: "/admin/specimen-books", label: "Specimen Books", Icon: BookOpen },
  { href: "/admin/crm?tab=schools", label: "CRM Database Hub", Icon: Database },
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

  const [badgeCounts, setBadgeCounts] = useState({
    orders: 0,
    bulkOrders: 0,
    specimenRequests: 0,
    reminders: 0,
  });

  const isLoginPage = pathname === "/admin/login";

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
  }, [checked, isLoginPage, pathname]);

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

  if (isLoginPage) return <>{children}</>;

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            {coreLinks.map(({ href, label, Icon, badgeKey }) => {
              const active = isActive(href);
              const badgeCount = badgeKey ? badgeCounts[badgeKey] || 0 : 0;

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors text-sm
                      ${active
                        ? "bg-purple-50 text-purple-700 border border-purple-200 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-transparent"
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={20} aria-hidden="true" />
                      <span>{label}</span>
                    </div>
                    {badgeCount > 0 && (
                      <span className="bg-red-500 text-white font-bold text-xs px-2 py-0.5 rounded-full shadow-xs">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Admin collapsible section */}
            <li>
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors
                  ${adminLinks.some(link => isActive(link.href))
                    ? "text-purple-700 bg-purple-50/50"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield size={20} className={adminLinks.some(link => isActive(link.href)) ? "text-purple-700" : "text-gray-500"} />
                  <span>Admin</span>
                </div>
                {adminExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {adminExpanded && (
                <ul className="ml-6 pl-3 border-l border-gray-200 space-y-1 mt-1">
                  {adminLinks.map(({ href, label, Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setSidebarOpen(false)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm
                            ${active
                              ? "bg-purple-50 text-purple-700 font-semibold"
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

            {/* Upload collapsible section */}
            <li>
              <button
                onClick={() => setUploadExpanded(!uploadExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm font-semibold transition-colors
                  ${uploadLinks.some(link => isActive(link.href))
                    ? "text-purple-700 bg-purple-50/50"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <UploadCloud size={20} className={uploadLinks.some(link => isActive(link.href)) ? "text-purple-700" : "text-gray-500"} />
                  <span>Upload</span>
                </div>
                {uploadExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {uploadExpanded && (
                <ul className="ml-6 pl-3 border-l border-gray-200 space-y-1 mt-1">
                  {uploadLinks.map(({ href, label, Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setSidebarOpen(false)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm
                            ${active
                              ? "bg-purple-50 text-purple-700 font-semibold"
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
          {children}
        </main>
      </div>
    </div>
  );
}
