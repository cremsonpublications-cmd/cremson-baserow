"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../../lib/api/addresses";
import { MapPin, Plus, Pencil, Trash2, Star, X, ChevronDown } from "lucide-react";

function AddressSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-5 bg-gray-200 rounded w-44" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <div className="h-8 bg-gray-200 rounded-lg w-16" />
              <div className="h-8 bg-gray-200 rounded-lg w-24" />
              <div className="h-8 bg-gray-200 rounded-lg w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
];

const EMPTY_FORM = {
  label: "Home",
  first_name: "",
  last_name: "",
  company: "",
  street_address: "",
  apartment: "",
  city: "",
  state: "",
  pin_code: "",
  phone: "",
  country: "India",
  is_default: false,
};

export default function AddressesPage() {
  const { user, authToken, authLoading } = useApp();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

  const loadAddresses = useCallback(async () => {
    if (!authToken) return;
    try {
      const data = await getAddresses(authToken);
      setAddresses(data);
    } catch {
      // error toast shown automatically by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken) loadAddresses();
  }, [authToken, loadAddresses]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, is_default: addresses.length === 0 });
    setShowModal(true);
  }

  function openEdit(addr) {
    setEditingId(addr.id);
    setForm({
      label: addr.label || "Home",
      first_name: addr.first_name,
      last_name: addr.last_name,
      company: addr.company || "",
      street_address: addr.street_address,
      apartment: addr.apartment || "",
      city: addr.city,
      state: addr.state,
      pin_code: addr.pin_code,
      phone: addr.phone || "",
      country: addr.country || "India",
      is_default: !!addr.is_default,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateAddress(authToken, editingId, form);
      } else {
        await addAddress(authToken, form);
      }
      closeModal();
      loadAddresses();
    } catch {
      // error toast shown automatically by axios interceptor
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteAddress(authToken, id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // error toast shown automatically by axios interceptor
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id) {
    try {
      await setDefaultAddress(authToken, id);
      loadAddresses();
    } catch {
      // error toast shown automatically by axios interceptor
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MapPin className="text-red-500 w-6 h-6" />
              <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
            </div>
            <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <AddressSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <MapPin className="text-red-500 w-6 h-6" />
            <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        {/* Address list */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You have no saved addresses yet.</p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add your first address
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-xl border p-5 transition-shadow ${
                  addr.is_default ? "border-red-400 shadow-md" : "border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Label + default badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      {addr.is_default ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                          <Star className="w-3 h-3 fill-red-500" /> Default
                        </span>
                      ) : null}
                    </div>
                    {/* Name */}
                    <p className="font-semibold text-gray-900">
                      {addr.first_name} {addr.last_name}
                    </p>
                    {addr.company && (
                      <p className="text-sm text-gray-500">{addr.company}</p>
                    )}
                    {/* Address lines */}
                    <p className="text-sm text-gray-700 mt-1">
                      {addr.street_address}
                      {addr.apartment ? `, ${addr.apartment}` : ""}
                    </p>
                    <p className="text-sm text-gray-700">
                      {addr.city}, {addr.state} — {addr.pin_code}
                    </p>
                    <p className="text-sm text-gray-700">{addr.country}</p>
                    {addr.phone && (
                      <p className="text-sm text-gray-500 mt-1">Ph: {addr.phone}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(addr)}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" /> Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === addr.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight: "calc(100vh - 120px)"}}>
            {/* Modal header — sticky */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form — scrollable middle */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Label
                </label>
                <div className="relative">
                  <select
                    name="label"
                    value={form.label}
                    onChange={handleChange}
                    className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 pr-8"
                  >
                    {["Home", "Work", "Other"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Street address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="street_address"
                  value={form.street_address}
                  onChange={handleChange}
                  required
                  placeholder="House no., street name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Apartment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment / Suite / Unit <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  name="apartment"
                  value={form.apartment}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* City + PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PIN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="pin_code"
                    value={form.pin_code}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    title="6-digit PIN code"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    required
                    className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 pr-8"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Default checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={form.is_default}
                  onChange={handleChange}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>
            </div>

              {/* Submit — sticky footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
