"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers, Plus, Trash2, Cpu } from "lucide-react";

const AI_ANALYSIS_STEPS = [
  "Analyzing target CBSE curriculum & syllabus parameters...",
  "Evaluating chapter coverage & topic weighting...",
  "Scanning Cremson verified question bank repository...",
  "Applying difficulty balance & competency matrix...",
  "Generating final question paper structure..."
];

export default function BlueprintSelector({
  setup,
  blueprint,
  onBlueprintChange,
  mode,
  onModeChange,
  onQuickGenerate,
  onManualSelect,
  manualQuestions,
  selectedManualIds,
  onToggleManualQuestion,
  isGenerating
}) {
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);

  const totalBlueprintMarks = blueprint.reduce(
    (sum, item) => sum + (parseInt(item.quantity) || 0) * (parseInt(item.marks_each) || 0),
    0
  );

  const marksMatch = totalBlueprintMarks === setup.max_marks;

  const handleQtyChange = (idx, newQty) => {
    const updated = [...blueprint];
    updated[idx].quantity = Math.max(0, parseInt(newQty) || 0);
    onBlueprintChange(updated);
  };

  const handleMarksChange = (idx, newMarks) => {
    const updated = [...blueprint];
    updated[idx].marks_each = Math.max(1, parseInt(newMarks) || 1);
    onBlueprintChange(updated);
  };

  const handleStartAiGeneration = () => {
    setIsAiAnalyzing(true);
    setAnalysisIndex(0);
  };

  useEffect(() => {
    if (!isAiAnalyzing) return;

    const interval = setInterval(() => {
      setAnalysisIndex((prev) => {
        if (prev < AI_ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setIsAiAnalyzing(false);
            onQuickGenerate();
          }, 600);
          return prev;
        }
      });
    }, 700);

    return () => clearInterval(interval);
  }, [isAiAnalyzing, onQuickGenerate]);

  const selectedManualQuestions = manualQuestions.filter((q) => selectedManualIds.includes(q.id));
  const manualTotalMarks = selectedManualQuestions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6 text-black">
      {/* Mode Switcher Single Line Tab */}
      <div className="border-b border-neutral-300 flex items-center gap-8 px-2 mb-6">
        <button
          type="button"
          onClick={() => onModeChange("quick")}
          className={`py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            mode === "quick"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          Quick Generate (Blueprint)
        </button>
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={`py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            mode === "manual"
              ? "border-black text-black"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          Manual Question Selection
        </button>
      </div>

      {mode === "quick" ? (
        /* QUICK GENERATE BLUEPRINT FORM */
        <div className="bg-white rounded-2xl border border-neutral-300 p-6 md:p-8 shadow-sm">
          <div className="border-b border-neutral-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <Layers className="w-5 h-5 text-black" />
                Paper Blueprint Calculation
              </h3>
              <p className="text-neutral-600 text-xs mt-1">
                Define total questions and mark distribution across standard CBSE paper sections.
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 ${
                marksMatch
                  ? "bg-neutral-100 text-black border-neutral-400"
                  : "bg-neutral-200 text-black border-black"
              }`}
            >
              {marksMatch ? (
                <CheckCircle2 className="w-4 h-4 text-black" />
              ) : (
                <AlertCircle className="w-4 h-4 text-black" />
              )}
              Blueprint Marks: {totalBlueprintMarks} / {setup.max_marks} Marks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-black">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 uppercase text-[11px] tracking-wider text-neutral-700">
                  <th className="py-3 px-4 rounded-l-lg">Question Type</th>
                  <th className="py-3 px-4">Marks Per Question</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Section Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {blueprint.map((item, idx) => {
                  const subtotal = item.quantity * item.marks_each;
                  return (
                    <tr key={item.question_type} className="hover:bg-neutral-50">
                      <td className="py-3 px-4 font-semibold text-black">
                        {item.question_type}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={item.marks_each}
                          onChange={(e) => handleMarksChange(idx, e.target.value)}
                          className="w-20 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-black text-center focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(idx, e.target.value)}
                          className="w-24 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-black text-center font-bold focus:ring-2 focus:ring-black focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {subtotal} Marks
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300 font-bold bg-neutral-100">
                  <td colSpan={2} className="py-4 px-4 text-black text-base">
                    Total Question Paper Sum
                  </td>
                  <td className="py-4 px-4 text-black">
                    {blueprint.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0)} Questions
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-600 font-bold text-base">
                    {totalBlueprintMarks} / {setup.max_marks} Marks
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!marksMatch && (
            <div className="mt-4 p-3 bg-neutral-100 border border-black rounded-xl text-black text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-black" />
              <span>
                The current total blueprint marks ({totalBlueprintMarks}) do not equal your target Maximum Marks ({setup.max_marks}). Please adjust section quantities.
              </span>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <button
              type="button"
              onClick={() => onModeChange("manual")}
              className="text-black font-semibold text-sm underline hover:text-neutral-700"
            >
              Switch to Manual Question Picker instead →
            </button>

            <button
              type="button"
              disabled={isGenerating || isAiAnalyzing}
              onClick={handleStartAiGeneration}
              className="cursor-pointer px-8 py-3 bg-black hover:bg-neutral-900 disabled:opacity-50 text-white font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2"
            >
              {isGenerating || isAiAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating Question Paper...
                </>
              ) : (
                <>Quick Generate Paper</>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* MANUAL SELECTION LIST */
        <div className="bg-white rounded-2xl border border-neutral-300 p-6 md:p-8 shadow-sm">
          <div className="sticky top-4 z-10 bg-black text-white p-4 rounded-xl shadow-md mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider">
                Current Manual Selection Tally
              </div>
              <div className="text-lg font-bold">
                Selected: {selectedManualIds.length} questions · {manualTotalMarks} / {setup.max_marks} marks
              </div>
            </div>

            <button
              type="button"
              onClick={onManualSelect}
              disabled={selectedManualIds.length === 0}
              className="px-6 py-2.5 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 font-bold rounded-lg transition text-sm flex items-center gap-1.5"
            >
              Proceed with Selected Questions ({selectedManualIds.length})
            </button>
          </div>

          <div className="space-y-4">
            {manualQuestions.map((q) => {
              const isSelected = selectedManualIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-black bg-neutral-100 shadow-sm"
                      : "border-neutral-300 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Question Type: Indigo Tag */}
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {q.question_type}
                        </span>
                        {/* Chapter: Slate Tag */}
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {q.chapter}
                        </span>
                        {/* Marks: Emerald Tag */}
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                        </span>
                        {/* Difficulty: Dynamic Color by Level */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                            q.difficulty === "Easy"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : q.difficulty === "Moderate"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="text-black font-medium whitespace-pre-line text-sm pt-1">
                        {q.question_text}
                      </div>

                      {q.option_a && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-200 mt-2">
                          <div><span className="font-bold">(A)</span> {q.option_a}</div>
                          <div><span className="font-bold">(B)</span> {q.option_b}</div>
                          {q.option_c && <div><span className="font-bold">(C)</span> {q.option_c}</div>}
                          {q.option_d && <div><span className="font-bold">(D)</span> {q.option_d}</div>}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleManualQuestion(q.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? "bg-black text-white hover:bg-neutral-800"
                          : "bg-neutral-100 border border-neutral-400 text-black hover:bg-neutral-200"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add Question
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI GENERATION ANIMATION OVERLAY */}
      {isAiAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-300 text-black rounded-2xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-wide text-black flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-black animate-spin" />
                Cremson Paper Engine Processing...
              </h3>
              <p className="text-neutral-500 text-xs uppercase tracking-widest font-semibold">
                Class XII Entrepreneurship
              </p>
            </div>

            {/* Changing Status Words */}
            <div className="bg-neutral-100 border border-neutral-300 p-4 rounded-xl min-h-[72px] flex items-center justify-center text-sm font-semibold text-black">
              <span key={analysisIndex} className="animate-in fade-in duration-300">
                {AI_ANALYSIS_STEPS[analysisIndex]}
              </span>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-2">
              {AI_ANALYSIS_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === analysisIndex
                      ? "w-8 bg-black"
                      : idx < analysisIndex
                      ? "w-2 bg-neutral-400"
                      : "w-2 bg-neutral-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
