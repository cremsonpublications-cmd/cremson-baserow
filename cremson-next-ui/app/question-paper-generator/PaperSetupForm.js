"use client";

import React from "react";
import { Sparkles, Calendar, BookOpen, User, Building2, Clock, Award } from "lucide-react";

export default function PaperSetupForm({ setup, onChange, onNext, meta }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  const handleChapterToggle = (chap) => {
    let current = [...setup.chapters];
    if (current.includes(chap)) {
      current = current.filter((c) => c !== chap);
    } else {
      current.push(chap);
    }
    onChange({ ...setup, chapters: current });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-300 p-6 md:p-8 shadow-sm">
      <div className="border-b border-neutral-200 pb-5 mb-6">
        <h2 className="text-2xl font-bold text-black flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-black" />
          Step 1: Question Paper Setup
        </h2>
        <p className="text-neutral-600 text-sm mt-1">
          Configure test parameters, basic details, and select target chapters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paper Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2">
            Paper Type
          </label>
          <select
            value={setup.paper_type}
            onChange={(e) => onChange({ ...setup, paper_type: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          >
            <option value="Chapter Test">Chapter Test</option>
            <option value="Unit Test">Unit Test</option>
            <option value="Practice Worksheet">Practice Worksheet</option>
            <option value="Custom Paper">Custom Paper</option>
          </select>
        </div>

        {/* Test Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2">
            Test Title *
          </label>
          <input
            type="text"
            required
            value={setup.test_title}
            onChange={(e) => onChange({ ...setup, test_title: e.target.value })}
            placeholder="e.g. Entrepreneurship Unit Test"
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>

        {/* Class */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2">
            Class
          </label>
          <select
            value={setup.class_name}
            onChange={(e) => onChange({ ...setup, class_name: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          >
            {meta?.classes?.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2">
            Subject
          </label>
          <select
            value={setup.subject}
            onChange={(e) => onChange({ ...setup, subject: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          >
            {meta?.subjects?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-500" /> Duration
          </label>
          <input
            type="text"
            value={setup.duration}
            onChange={(e) => onChange({ ...setup, duration: e.target.value })}
            placeholder="e.g. 45 Minutes or 3 Hours"
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>

        {/* Maximum Marks */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-neutral-500" /> Maximum Marks
          </label>
          <input
            type="number"
            min={5}
            max={100}
            value={setup.max_marks}
            onChange={(e) => onChange({ ...setup, max_marks: parseInt(e.target.value) || 30 })}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2">
            Target Difficulty Level
          </label>
          <select
            value={setup.difficulty}
            onChange={(e) => onChange({ ...setup, difficulty: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          >
            <option value="Balanced">Balanced (Standard CBSE Ratio)</option>
            <option value="Easy">Easy (Conceptual Emphasis)</option>
            <option value="Challenging">Challenging (High Competency)</option>
          </select>
        </div>

        {/* Examination Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" /> Exam Date (Optional)
          </label>
          <input
            type="text"
            value={setup.examination_date || ""}
            onChange={(e) => onChange({ ...setup, examination_date: e.target.value })}
            placeholder="e.g. 28/09/2026 or ____________"
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>

        {/* School Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" /> School Name (Optional Header)
          </label>
          <input
            type="text"
            value={setup.school_name || ""}
            onChange={(e) => onChange({ ...setup, school_name: e.target.value })}
            placeholder="e.g. Cremson Public School"
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>

        {/* Teacher Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-2 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-neutral-500" /> Teacher / Author Name (Optional)
          </label>
          <input
            type="text"
            value={setup.teacher_name || ""}
            onChange={(e) => onChange({ ...setup, teacher_name: e.target.value })}
            placeholder="e.g. Dr. A. K. Sharma"
            className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black focus:ring-2 focus:ring-black focus:outline-none transition"
          />
        </div>
      </div>

      {/* Chapters Selection */}
      <div className="mt-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-black mb-3">
          Select Chapters / Units (Multiple Allowed)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {meta?.chapters?.map((chap) => {
            const isSelected = setup.chapters.includes(chap);
            return (
              <button
                type="button"
                key={chap}
                onClick={() => handleChapterToggle(chap)}
                className={`p-3 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                  isSelected
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-neutral-300 bg-white text-black hover:border-neutral-400"
                }`}
              >
                <span>{chap}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                    isSelected
                      ? "border-white bg-white text-black font-bold"
                      : "border-neutral-400 bg-white"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className="cursor-pointer px-8 py-3 bg-black hover:bg-neutral-900 text-white font-semibold rounded-xl shadow transition-all flex items-center justify-center"
        >
          Proceed to Blueprint & Selection
        </button>

      </div>
    </form>
  );
}
