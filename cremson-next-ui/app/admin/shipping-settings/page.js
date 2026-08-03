"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateShippingSetting } from "../../../lib/api/admin";
import { 
  X, 
  Edit3, 
  Settings, 
  Truck, 
  Info,
  ChevronDown
} from "lucide-react";

function EditSettingModal({ setting, onClose, onSaved }) {
  if (!setting) return null;

  const [form, setForm] = useState({
    Name: setting.Name ?? setting.name ?? setting.zone_name ?? setting.zone ?? setting.label ?? "",
    shipping_charge: setting.shipping_charge != null ? String(setting.shipping_charge) : "",
    free_delivery_threshold: setting.free_delivery_threshold != null ? String(setting.free_delivery_threshold) : "",
    shipping_enabled: setting.shipping_enabled ?? setting.Active ?? true,
    Notes: setting.Notes ?? setting.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        Name: form.Name,
        shipping_charge: form.shipping_charge,
        free_delivery_threshold: form.free_delivery_threshold,
        shipping_enabled: form.shipping_enabled,
        Active: form.shipping_enabled, // Sync both active flags
        Notes: form.Notes,
      };
      await adminUpdateShippingSetting(setting.id, payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Edit Shipping Rules</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure delivery charge overrides for Row ID: {setting.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="text-red-750 text-xs font-bold bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Rule / Zone Name</label>
              <input 
                name="Name" 
                value={form.Name} 
                onChange={handleChange} 
                placeholder="e.g. Standard Shipping"
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Shipping Charge (₹)</label>
                <input 
                  name="shipping_charge" 
                  type="number" 
                  value={form.shipping_charge} 
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Free Threshold (₹)</label>
                <input 
                  name="free_delivery_threshold" 
                  type="number" 
                  value={form.free_delivery_threshold} 
                  onChange={handleChange} 
                  placeholder="0.00"
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes / Description</label>
              <textarea 
                name="Notes" 
                value={form.Notes} 
                onChange={handleChange} 
                rows={3} 
                placeholder="Describe shipping terms or carrier detail..."
                className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>

            <div className="flex items-center gap-2.5 p-1">
              <input 
                type="checkbox" 
                name="shipping_enabled" 
                id="shipping_enabled" 
                checked={form.shipping_enabled} 
                onChange={handleChange} 
                className="w-4 h-4 text-red-655 rounded border-slate-300 focus:ring-red-500" 
              />
              <label htmlFor="shipping_enabled" className="text-xs font-bold text-slate-700 cursor-pointer">Shipping Enabled</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-750 active:bg-blue-800 rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ["ID", "Name / Zone", "Shipping Charge", "Free Threshold", "Notes", "Status", "Actions"];

export default function AdminShippingSettings() {
  const queryClient = useQueryClient();
  const [editSetting, setEditSetting] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shipping-settings"],
    queryFn: async () => {
      const { data } = await api.get("/api/shipping-settings/", { params: { size: 200 } });
      return data;
    },
  });

  const settings = data?.results ?? data?.items ?? [];
  const count = data?.count ?? data?.total ?? settings.length;

  function handleSaved() {
    setEditSetting(null);
    queryClient.invalidateQueries({ queryKey: ["admin-shipping-settings"] });
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-left">
      
      {/* Header Info Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shipping Settings</h1>
            <span className="bg-red-50 text-red-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-red-100">
              {count} Rules
            </span>
          </div>
          <p className="text-sm text-slate-550 mt-1">Configure baseline delivery rates, regional shipping zone charges, and checkout free threshold limits.</p>
        </div>
      </div>

      {/* Grid List Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_rgb(0,0,0,0.015)] overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 animate-pulse bg-white">
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {COLS.map((h) => <td key={h} className="px-5 py-4"><div className="h-4 bg-slate-150 rounded w-20" /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : settings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white">
            <Truck className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">No active shipping parameters mapped.</p>
          </div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/75">
                <tr>{COLS.map((h) => <th key={h} className="px-5 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {settings.map((s) => {
                  const isActive = s.shipping_enabled ?? s.Active ?? s.is_active ?? s.active;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID */}
                      <td className="px-5 py-4 text-xs font-bold text-slate-500 font-mono">
                        #{s.id}
                      </td>

                      {/* Name / Zone */}
                      <td className="px-5 py-4 text-xs font-bold text-slate-900">
                        {s.Name ?? s.name ?? s.zone_name ?? s.zone ?? s.label ?? `Rule #${s.id}`}
                      </td>

                      {/* Shipping Charge */}
                      <td className="px-5 py-4 text-xs font-black text-slate-900">
                        {s.shipping_charge != null || s.base_charge != null || s.charge != null ? (
                          `₹${Number(s.shipping_charge ?? s.base_charge ?? s.charge).toFixed(2)}`
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Free Delivery Threshold */}
                      <td className="px-5 py-4 text-xs text-slate-700 font-semibold">
                        {s.free_delivery_threshold != null || s.free_threshold != null ? (
                          `₹${Number(s.free_delivery_threshold ?? s.free_threshold).toFixed(2)}`
                        ) : (
                          <span className="text-slate-400">No Free Shipping</span>
                        )}
                      </td>

                      {/* Notes / Description */}
                      <td className="px-5 py-4 text-xs text-slate-550 max-w-[200px] truncate" title={s.Notes ?? s.description}>
                        {s.Notes ?? s.description ?? "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {isActive ? "Enabled" : "Disabled"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setEditSetting(s)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Shipping Rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {settings.map((s) => {
              const isActive = s.shipping_enabled ?? s.Active ?? s.is_active ?? s.active;
              return (
                <div key={s.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900">{s.Name ?? s.name ?? s.zone_name ?? `Rule #${s.id}`}</p>
                      {(s.Notes ?? s.description) && <p className="text-xs text-slate-500 mt-0.5 truncate">{s.Notes ?? s.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                        {isActive ? "Enabled" : "Disabled"}
                      </span>
                      <button onClick={() => setEditSetting(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 mb-0.5">Shipping Charge</p>
                      <p className="font-bold text-slate-900">{s.shipping_charge != null ? `₹${Number(s.shipping_charge).toFixed(2)}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-0.5">Free Threshold</p>
                      <p className="font-bold text-slate-900">{s.free_delivery_threshold != null ? `₹${Number(s.free_delivery_threshold).toFixed(2)}` : "No Free Shipping"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {editSetting && (
        <EditSettingModal
          setting={editSetting}
          onClose={() => setEditSetting(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
