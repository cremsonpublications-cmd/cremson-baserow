"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "../../lib/api/axios";

// Skeleton component
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function AdminDashboard() {
  const API = getApiBaseUrl();
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Fetch stat counts
  useEffect(() => {
    const endpoints = {
      categories: "/api/categories/?size=1",
      products: "/api/products/?size=1",
      orders: "/api/orders/?size=1",
    };
    Promise.all(
      Object.entries(endpoints).map(async ([key, path]) => {
        try {
          const res = await fetch(`${API}${path}`);
          const data = await res.json();
          return [key, data.count ?? data.total ?? "—"];
        } catch {
          return [key, "—"];
        }
      })
    ).then((pairs) => {
      setCounts(Object.fromEntries(pairs));
      setCountsLoading(false);
    });
  }, [API]);

  const statCards = [
    {
      key: "categories",
      label: "Total Categories",
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      emoji: "📁",
      href: "/admin/categories",
    },
    {
      key: "products",
      label: "Total Products",
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      emoji: "📦",
      href: "/admin/products",
    },
    {
      key: "orders",
      label: "Total Orders",
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      emoji: "🛒",
      href: "/admin/orders",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* ── Page Title ── */}
      <h2 className="text-2xl font-semibold text-gray-900 mt-0 mb-8">Dashboard</h2>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`${card.bg} rounded-xl p-6 border border-[#F3E8FF] hover:opacity-90 transition-opacity`}
            style={{ boxShadow: "rgba(0,0,0,0.1) 0px 4px 6px -1px, rgba(0,0,0,0.1) 0px 2px 4px -2px" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                {countsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {counts[card.key] !== undefined ? counts[card.key].toLocaleString() : "—"}
                  </p>
                )}
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <span className="text-xl">{card.emoji}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
