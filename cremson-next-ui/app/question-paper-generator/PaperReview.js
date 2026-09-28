"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, RefreshCw, Trash2, Plus, FileText, CheckCircle } from "lucide-react";

export default function PaperReview({
  setup,
  questions,
  onReplaceQuestion,
  onRemoveQuestion,
  onAddInternalChoice,
  onBack,
  manualBank
}) {
  const [activeTab, setActiveTab] = useState("paper"); // "paper" or "answer_key"

  const SECTION_TYPES = [
    { section: "SECTION A", title: "OBJECTIVE-TYPE QUESTIONS", type: "Objective" },
    { section: "SECTION B", title: "VERY SHORT-ANSWER QUESTIONS", type: "Very Short Answer" },
    { section: "SECTION C", title: "SHORT-ANSWER QUESTIONS", type: "Short Answer" },
    { section: "SECTION D", title: "LONG-ANSWER QUESTION", type: "Long Answer" },
    { section: "SECTION E", title: "CASE-BASED QUESTION", type: "Case-Based" },
  ];

  let currentQNum = 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Top Bar Navigation & Actions */}
      <div className="print:hidden bg-black text-white p-4 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-neutral-800">
        <button
          onClick={onBack}
          className="text-neutral-300 hover:text-white text-sm font-medium flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Edit / Blueprint
        </button>

        <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveTab("paper")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "paper" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Question Paper View
          </button>
          <button
            onClick={() => setActiveTab("answer_key")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "answer_key" ? "bg-white text-black font-bold" : "text-neutral-400 hover:text-white"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1.5" />
            Answer Key View
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* PRINTABLE PAPER CONTAINER */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-neutral-300 shadow-sm text-black font-serif max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none">
        {activeTab === "paper" ? (
          /* QUESTION PAPER FORMAT */
          <div>
            {/* Header / School Branding */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              {setup.school_name && (
                <div className="text-2xl font-black uppercase tracking-wider text-black mb-1">
                  {setup.school_name}
                </div>
              )}
              <div className="text-xl font-bold uppercase tracking-widest text-black">
                CREMSON PAPER BUILDER
              </div>
              <div className="text-xs font-sans tracking-widest uppercase text-neutral-600 mt-0.5">
                {setup.paper_type || "CHAPTER / UNIT TEST"} — 2026–27
              </div>
              <div className="text-sm font-bold uppercase tracking-wide mt-2 text-black">
                {setup.class_name?.toUpperCase()} — {setup.subject?.toUpperCase()}
              </div>
              <div className="text-base font-semibold mt-1 text-black">
                {setup.test_title}
              </div>
            </div>

            {/* Test Metadata Box */}
            <div className="grid grid-cols-3 text-xs font-sans border-b border-neutral-300 pb-3 mb-4 text-black">
              <div>
                <strong>Date:</strong> {setup.examination_date || "____________"}
              </div>
              <div className="text-center">
                <strong>Duration:</strong> {setup.duration || "45 Minutes"}
              </div>
              <div className="text-right">
                <strong>Maximum Marks:</strong> {setup.max_marks}
              </div>
            </div>

            {/* Student Info Lines */}
            <div className="flex justify-between text-xs font-sans mb-6 text-black">
              <div>
                Student Name: ____________________________
              </div>
              <div>
                Roll No.: __________
              </div>
            </div>

            {/* General Instructions */}
            <div className="border border-neutral-400 p-3 rounded text-xs font-sans mb-8 bg-neutral-50 print:bg-transparent">
              <div className="font-bold uppercase tracking-wider mb-1">General Instructions:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-neutral-800">
                <li>All questions are compulsory unless stated otherwise.</li>
                <li>Read each question carefully before answering.</li>
                <li>Marks are indicated against each question.</li>
                <li>Answer the questions in the sequence given.</li>
              </ol>
            </div>

            {/* Sections Rendering */}
            {SECTION_TYPES.map(({ section, title, type }) => {
              const secQuestions = questions.filter((q) => q.question_type === type);
              if (secQuestions.length === 0) return null;

              const secMarks = secQuestions.reduce((sum, q) => sum + q.marks, 0);
              const secQty = secQuestions.length;

              return (
                <div key={section} className="mb-8">
                  {/* Section Title Header */}
                  <div className="flex justify-between items-baseline border-b border-black pb-1 mb-4">
                    <div className="font-bold text-sm uppercase tracking-wide text-black">
                      {section} — {title}
                    </div>
                    <div className="text-xs font-sans font-bold text-black">
                      {secQty} × {secQuestions[0]?.marks} = {secMarks} Marks
                    </div>
                  </div>

                  {/* Section Questions */}
                  <div className="space-y-6">
                    {secQuestions.map((q) => {
                      const num = currentQNum++;

                      return (
                        <div key={q.id} className="relative group text-sm">
                          {/* Teacher Edit Controls */}
                          <div className="print:hidden absolute -right-2 -top-2 hidden group-hover:flex items-center gap-1 bg-black text-white p-1 rounded-lg shadow text-[10px] z-20">
                            <button
                              onClick={() => onReplaceQuestion(q.id, q.chapter, q.question_type, q.marks)}
                              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-600 flex items-center gap-1"
                              title="Replace with similar question"
                            >
                              <RefreshCw className="w-3 h-3" /> Replace
                            </button>
                            {q.question_type !== "Case-Based" && (
                              <button
                                onClick={() => onAddInternalChoice(q.id)}
                                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-600 flex items-center gap-1"
                                title="Add OR internal choice"
                              >
                                <Plus className="w-3 h-3" /> Add Choice
                              </button>
                            )}
                            <button
                              onClick={() => onRemoveQuestion(q.id)}
                              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-600 flex items-center gap-1"
                              title="Remove question"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>

                          {/* CASE-BASED RENDER */}
                          {q.question_type === "Case-Based" ? (
                            <div className="space-y-3">
                              <div className="font-bold flex items-start gap-2">
                                <span>{num}</span>
                                <div>
                                  Read the following case carefully and answer the sub-questions:
                                </div>
                              </div>
                              <div className="bg-neutral-50 print:bg-transparent p-4 rounded border border-neutral-300 text-xs italic leading-relaxed text-black">
                                {q.case_passage || q.question_text}
                              </div>

                              <div className="pl-6 space-y-3 pt-2">
                                {q.sub_questions?.map((sub, sIdx) => (
                                  <div key={sIdx} className="flex justify-between items-start text-xs">
                                    <div className="flex gap-2">
                                      <span className="font-bold">{sub.label || `${num}(${chr(sIdx)})`}</span>
                                      <span>{sub.question_text}</span>
                                    </div>
                                    <div className="font-sans font-semibold text-black text-[11px] shrink-0 ml-4">
                                      ({sub.marks})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* STANDARD QUESTION RENDER */
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex gap-2">
                                  <span className="font-bold">{num}</span>
                                  <div className="whitespace-pre-line">{q.question_text}</div>
                                </div>
                                <div className="font-sans font-semibold text-black text-xs shrink-0 ml-4">
                                  ({q.marks})
                                </div>
                              </div>

                              {q.option_a && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-6 pt-2 text-xs">
                                  <div>(A) {q.option_a}</div>
                                  <div>(B) {q.option_b}</div>
                                  {q.option_c && <div>(C) {q.option_c}</div>}
                                  {q.option_d && <div>(D) {q.option_d}</div>}
                                </div>
                              )}

                              {q.internal_choice && (
                                <div className="mt-4 pt-3 border-t border-dashed border-neutral-400">
                                  <div className="text-center font-bold uppercase text-xs tracking-wider my-2">
                                    OR
                                  </div>
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex gap-2">
                                      <span className="font-bold">{num} (Alternative)</span>
                                      <div className="whitespace-pre-line">
                                        {q.internal_choice.question_text}
                                      </div>
                                    </div>
                                    <div className="font-sans font-semibold text-black text-xs shrink-0 ml-4">
                                      ({q.internal_choice.marks})
                                    </div>
                                  </div>
                                  {q.internal_choice.option_a && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-6 pt-2 text-xs">
                                      <div>(A) {q.internal_choice.option_a}</div>
                                      <div>(B) {q.internal_choice.option_b}</div>
                                      {q.internal_choice.option_c && <div>(C) {q.internal_choice.option_c}</div>}
                                      {q.internal_choice.option_d && <div>(D) {q.internal_choice.option_d}</div>}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="border-t border-neutral-300 pt-4 mt-12 text-center text-xs text-neutral-600 font-sans flex justify-between items-center">
              <div>— END OF QUESTION PAPER —</div>
              <div>Generated using Cremson Test Builder</div>
            </div>
          </div>
        ) : (
          /* ANSWER KEY FORMAT */
          <div>
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <div className="text-xl font-bold uppercase tracking-widest text-black">
                CREMSON PAPER BUILDER
              </div>
              <div className="text-2xl font-black uppercase tracking-wider text-black mt-1">
                ANSWER KEY
              </div>
              <div className="text-sm font-semibold mt-1 text-black">
                {setup.class_name} — {setup.subject} | Maximum Marks: {setup.max_marks}
              </div>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {questions.map((q, idx) => {
                const qNum = idx + 1;
                return (
                  <div key={q.id} className="p-3 bg-neutral-50 rounded border border-neutral-300">
                    <div className="font-bold text-black mb-1 flex items-center justify-between">
                      <span>Question {qNum} ({q.question_type})</span>
                      <span className="text-black font-semibold">{q.marks} Marks</span>
                    </div>

                    {q.question_type === "Objective" ? (
                      <div>
                        <strong>Answer:</strong> Option ({q.correct_answer}) — {q.model_answer}
                      </div>
                    ) : q.question_type === "Case-Based" ? (
                      <div className="space-y-1 mt-1">
                        {q.sub_questions?.map((sub, sIdx) => (
                          <div key={sIdx}>
                            <strong>{sub.label || `${qNum}(${chr(sIdx)})`}:</strong> {sub.model_answer}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div><strong>Model Answer:</strong> {q.model_answer || "Refer to standard marking guidelines."}</div>
                        <div><strong>Marking Scheme:</strong> {q.marking_scheme}</div>
                      </div>
                    )}

                    {q.internal_choice && (
                      <div className="mt-2 pt-2 border-t border-neutral-300 text-black">
                        <strong>Alternative Answer (Question {qNum}):</strong>{" "}
                        {q.internal_choice.model_answer || q.internal_choice.correct_answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function chr(n) {
  return String.fromCharCode(97 + n);
}
