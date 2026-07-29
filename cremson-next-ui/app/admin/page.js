"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const statCards = [
  {
    key: "products",
    label: "Total Products",
    endpoint: "/api/products/?size=1",
    color: "bg-blue-500",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    key: "orders",
    label: "Total Orders",
    endpoint: "/api/orders/?size=1",
    color: "bg-green-500",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    key: "users",
    label: "Total Users",
    endpoint: "/api/users/?size=1",
    color: "bg-purple-500",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    key: "categories",
    label: "Total Categories",
    endpoint: "/api/categories/?size=1",
    color: "bg-orange-500",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z",
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-7 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const results = {};
      await Promise.all(
        statCards.map(async (card) => {
          try {
            const res = await fetch(`${API}${card.endpoint}`);
            if (res.ok) {
              const data = await res.json();
              results[card.key] = data.count ?? data.total ?? "—";
            } else {
              results[card.key] = "—";
            }
          } catch {
            results[card.key] = "—";
          }
        })
      );
      setStats(results);
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome to the Cremson admin panel.</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {loading
          ? statCards.map((c) => <SkeletonCard key={c.key} />)
          : statCards.map((card) => (
              <div key={card.key} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-0.5">
                      {stats[card.key] !== undefined ? stats[card.key].toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Overview */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statCards.map((card) => (
            <div key={card.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-md ${card.color} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">{card.label}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {loading ? (
                  <span className="inline-block w-8 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  stats[card.key] !== undefined ? stats[card.key].toLocaleString() : "—"
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
