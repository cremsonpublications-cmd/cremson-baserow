"use client";

import Link from "next/link";
import CPLogo from "../../components/CPLogo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "lucide-react";

const navLinks = [
  { href: "/admin",                  label: "Dashboard",         Icon: LayoutDashboard },
  { href: "/admin/crm",              label: "CRM Database Hub",   Icon: Database        },
  { href: "/admin/categories",       label: "Categories",        Icon: FolderOpen      },
  { href: "/admin/products",         label: "Products",          Icon: Package         },
  { href: "/admin/coupons",          label: "Coupons",           Icon: Ticket          },
  { href: "/admin/orders",           label: "Orders",            Icon: ShoppingCart    },
  { href: "/admin/users",            label: "Users",             Icon: Users           },
  { href: "/admin/specimen-requests",label: "Specimen Requests", Icon: FileText        },
  { href: "/admin/reviews",          label: "Reviews",           Icon: MessageSquare   },
  { href: "/admin/settings",          label: "Settings",          Icon: Settings        },
];

export default function AdminLayout({ children }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [checked, setChecked]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setChecked(true); return; }
    const token = typeof window !== "undefined" && localStorage.getItem("cremson_admin_token");
    if (!token) { router.replace("/admin/login"); } else { setChecked(true); }
  }, [isLoginPage, router]);

  function handleLogout() {
    localStorage.removeItem("cremson_admin_token");
    router.replace("/admin/login");
  }

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

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
            {navLinks.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-sm
                      ${active
                        ? "bg-purple-50 text-purple-700 border border-purple-200 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-transparent"
                      }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
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
