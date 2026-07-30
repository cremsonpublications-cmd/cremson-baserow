"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  ShoppingCart, 
  Users, 
  Grid, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8000";

const statCards = [
  {
    key: "products",
    label: "Total Products",
    endpoint: "/api/products/?size=1",
    color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100",
    icon: <BookOpen className="w-5 h-5" />,
    href: "/admin/products"
  },
  {
    key: "orders",
    label: "Total Orders",
    endpoint: "/api/orders/?size=1",
    color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-100",
    icon: <ShoppingCart className="w-5 h-5" />,
    href: "/admin/orders"
  },
  {
    key: "users",
    label: "Total Users",
    endpoint: "/api/users/?size=1",
    color: "from-purple-500/10 to-fuchsia-500/10 text-purple-600 border-purple-100",
    icon: <Users className="w-5 h-5" />,
    href: "/admin/users"
  },
  {
    key: "categories",
    label: "Total Categories",
    endpoint: "/api/categories/?size=1",
    color: "from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-100",
    icon: <Grid className="w-5 h-5" />,
    href: "/admin/categories"
  },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <div className="h-3 bg-slate-100 rounded w-24 mb-2" />
          <div className="h-7 bg-slate-100 rounded w-16" />
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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-left">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1425] to-[#1e294b] text-white p-6 md:p-8 shadow-xl border border-slate-800/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-40 h-40" />
        </div>
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            System Live & Online
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Welcome back, Admin
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Monitor product metrics, process shipments, manage active coupons and configure school specimen requests from one single interface.
          </p>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div>
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
          Quick Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? statCards.map((c) => <SkeletonCard key={c.key} />)
            : statCards.map((card) => (
                <Link 
                  href={card.href} 
                  key={card.key} 
                  className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          {card.label}
                        </p>
                        <p className="text-2xl font-black text-slate-900 mt-1">
                          {stats[card.key] !== undefined ? stats[card.key].toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-slate-50 rounded-lg">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* Quick Overview Table List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns (Dynamic Links & Management shortcuts) */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_rgb(0,0,0,0.01)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Quick Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Summary values of active database resources.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="divide-y divide-slate-50">
            {statCards.map((card) => (
              <div key={card.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                    {card.icon}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">{card.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {loading ? (
                      <span className="inline-block w-6 h-4 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      stats[card.key] !== undefined ? stats[card.key].toLocaleString() : "—"
                    )}
                  </span>
                  <Link href={card.href} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column (Configuration / Specimen Quick Card) */}
        <div className="bg-[#0d1425] text-white border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Logistics & Shipway</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect and sync actual order deliveries with the carrier platform. Manage warehouse addresses and automatic WhatsApp messages.
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <Link 
              href="/admin/orders" 
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-950/20 transition-colors"
            >
              Go to Order Shipments
            </Link>
            <Link 
              href="/admin/shipping-settings" 
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl transition-colors"
            >
              Configure Shipping Rates
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
