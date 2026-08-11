"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  User,
  Building2,
  X,
  Check,
  Search,
} from "lucide-react";
import api from "@/lib/api/axios";
import { toast } from "sonner";

export default function AdminRemindersPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    notes: "",
    due_date: new Date().toISOString().split("T")[0],
    due_time: "10:00 AM",
    teacher_name: "",
    school_name: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reminders"],
    queryFn: async () => {
      const res = await api.get("/api/reminders/");
      return res.data;
    },
  });

  const reminders = Array.isArray(data?.reminders) ? data.reminders : [];

  // Categorize reminders
  const pendingReminders = reminders.filter((r) => r.status === "pending");
  const overdueReminders = pendingReminders.filter((r) => r.is_overdue);
  const todayReminders = pendingReminders.filter((r) => r.is_today);
  const completedReminders = reminders.filter((r) => r.status === "completed");

  const filteredList = reminders.filter((r) => {
    // Tab filter
    if (activeFilter === "overdue" && (!r.is_overdue || r.status === "completed")) return false;
    if (activeFilter === "today" && (!r.is_today || r.status === "completed")) return false;
    if (activeFilter === "pending" && r.status !== "pending") return false;
    if (activeFilter === "completed" && r.status !== "completed") return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = (r.title || "").toLowerCase().includes(q);
      const matchNotes = (r.notes || "").toLowerCase().includes(q);
      const matchTeacher = (r.teacher_name || "").toLowerCase().includes(q);
      const matchSchool = (r.school_name || "").toLowerCase().includes(q);
      return matchTitle || matchNotes || matchTeacher || matchSchool;
    }
    return true;
  });

  // Handle Mark Completed
  const handleMarkCompleted = async (id) => {
    try {
      await api.patch(`/api/reminders/${id}/complete`);
      toast.success("Reminder marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to mark reminder completed.");
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    try {
      await api.delete(`/api/reminders/${id}`);
      toast.success("Reminder deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
    } catch (err) {
      toast.error("Failed to delete reminder.");
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.due_date) {
      toast.error("Please provide Title and Due Date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/reminders/", form);
      toast.success("Reminder created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-reminders"] });
      setCreateModalOpen(false);
      setForm({
        title: "",
        notes: "",
        due_date: new Date().toISOString().split("T")[0],
        due_time: "10:00 AM",
        teacher_name: "",
        school_name: "",
      });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create reminder.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-purple-600" />
            Reminders & Follow-ups
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track teacher calls, follow-up dates, and overdue task alerts.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {/* ── Stat Cards Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter("overdue")}
          className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Overdue</span>
            <div className="text-3xl font-extrabold text-red-700 mt-1">{overdueReminders.length}</div>
            <p className="text-xs text-red-500 mt-1">Passed due date</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter("today")}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Due Today</span>
            <div className="text-3xl font-extrabold text-amber-700 mt-1">{todayReminders.length}</div>
            <p className="text-xs text-amber-500 mt-1">Action needed today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter("pending")}
          className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Total Pending</span>
            <div className="text-3xl font-extrabold text-purple-700 mt-1">{pendingReminders.length}</div>
            <p className="text-xs text-purple-500 mt-1">Active follow-ups</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => setActiveFilter("completed")}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
        >
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{completedReminders.length}</div>
            <p className="text-xs text-emerald-500 mt-1">Finished tasks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { id: "all", label: `All (${reminders.length})` },
            { id: "overdue", label: `Overdue (${overdueReminders.length})` },
            { id: "today", label: `Due Today (${todayReminders.length})` },
            { id: "pending", label: `Pending (${pendingReminders.length})` },
            { id: "completed", label: `Completed (${completedReminders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-purple-500 bg-gray-50/50"
          />
        </div>
      </div>

      {/* ── Reminders List ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading reminders...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No reminders found</h3>
            <p className="text-xs text-gray-400 mt-1">There are no reminders matching your current filter.</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                item.status === "completed"
                  ? "border-gray-200 opacity-60 bg-gray-50/50"
                  : item.is_overdue
                  ? "border-red-300 bg-red-50/20"
                  : item.is_today
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-gray-200 hover:border-purple-200"
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`text-base font-bold text-gray-900 ${item.status === "completed" ? "line-through text-gray-500" : ""}`}>
                    {item.title}
                  </h3>

                  {/* Overdue Badge */}
                  {item.status === "pending" && item.is_overdue && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      Overdue by {item.overdue_days} {item.overdue_days === 1 ? "day" : "days"}
                    </span>
                  )}

                  {/* Due Today Badge */}
                  {item.status === "pending" && item.is_today && (
                    <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Clock className="w-3 h-3" />
                      Due Today
                    </span>
                  )}

                  {/* Completed Badge */}
                  {item.status === "completed" && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Sub details: Teacher / School / Notes */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                  {item.teacher_name && (
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      Teacher: {item.teacher_name}
                    </span>
                  )}
                  {item.school_name && (
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      School: {item.school_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Due: {item.due_date} {item.due_time ? `at ${item.due_time}` : ""}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-sans">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                {item.status === "pending" && (
                  <button
                    onClick={() => handleMarkCompleted(item.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Mark Completed
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete Reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create Reminder Modal ── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Create New Reminder
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reminder Title / Task <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call Teacher Arjun regarding specimen book delivery"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reminder Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:00 AM"
                    value={form.due_time}
                    onChange={(e) => setForm({ ...form, due_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Teacher Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Sri"
                    value={form.teacher_name}
                    onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    School Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kendriya Vidyalaya"
                    value={form.school_name}
                    onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes / Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context or notes for this follow-up call..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
