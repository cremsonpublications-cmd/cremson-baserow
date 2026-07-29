"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../lib/api/axios";
import { adminUpdateShippingSetting } from "../../../lib/api/admin";

function EditSettingModal({ setting, onClose, onSaved }) {
  if (!setting) return null;

  const [form, setForm] = useState({
    name: setting.name ?? setting.zone_name ?? setting.zone ?? setting.label ?? "",
    value: setting.value != null ? String(setting.value) : "",
    description: setting.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {};
      if (form.name) payload.name = form.name;
      if (form.value !== "") payload.value = form.value;
      if (form.description) payload.description = form.description;
      await adminUpdateShippingSetting(setting.id, payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Shipping Setting</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Value</label>
            <input name="value" value={form.value} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COLS = ["ID", "Name / Zone", "Base Charge (₹)", "Free Threshold (₹)", "Express Charge (₹)", "Is Active", "Actions"];

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
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">{count}</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {COLS.map((h) => <td key={h} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : settings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No shipping settings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>{COLS.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200">
                {settings.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {s.name ?? s.zone_name ?? s.zone ?? s.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.base_charge != null || s.shipping_charge != null || s.charge != null
                        ? `₹${Number(s.base_charge ?? s.shipping_charge ?? s.charge).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.free_delivery_threshold != null || s.free_threshold != null || s.free_shipping_above != null
                        ? `₹${Number(s.free_delivery_threshold ?? s.free_threshold ?? s.free_shipping_above).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.express_charge != null || s.express_shipping_charge != null
                        ? `₹${Number(s.express_charge ?? s.express_shipping_charge).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${(s.is_active ?? s.active) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {(s.is_active ?? s.active) ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setEditSetting(s)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
