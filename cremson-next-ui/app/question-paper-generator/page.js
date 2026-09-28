"use client";

import React, { useState, useEffect } from "react";
import PaperSetupForm from "./PaperSetupForm";
import BlueprintSelector from "./BlueprintSelector";
import PaperReview from "./PaperReview";
import { toast } from "sonner";
import { BookOpen, Sparkles, CheckCircle, Database } from "lucide-react";
import Link from "next/link";

export default function QuestionPaperGeneratorPage() {
  const [step, setStep] = useState(1); // 1: Setup, 2: Blueprint/Selection, 3: Review
  const [meta, setMeta] = useState({
    classes: ["Class XII"],
    subjects: ["Entrepreneurship"],
    chapters: ["Entrepreneurial Opportunity", "Business Planning", "Enterprise Marketing"],
    question_types: ["Objective", "Very Short Answer", "Short Answer", "Long Answer", "Case-Based"]
  });

  // Step 1 Setup State
  const [setup, setSetup] = useState({
    paper_type: "Chapter Test",
    class_name: "Class XII",
    subject: "Entrepreneurship",
    chapters: ["Entrepreneurial Opportunity"],
    test_title: "Entrepreneurship Unit Test",
    duration: "45 Minutes",
    max_marks: 30,
    examination_date: "",
    school_name: "",
    teacher_name: "",
    difficulty: "Balanced"
  });

  // Step 2 Blueprint State
  const [blueprint, setBlueprint] = useState([
    { question_type: "Objective", quantity: 5, marks_each: 1 },
    { question_type: "Very Short Answer", quantity: 3, marks_each: 2 },
    { question_type: "Short Answer", quantity: 3, marks_each: 3 },
    { question_type: "Long Answer", quantity: 1, marks_each: 5 },
    { question_type: "Case-Based", quantity: 1, marks_each: 5 }
  ]);

  const [mode, setMode] = useState("quick"); // "quick" or "manual"
  const [manualQuestions, setManualQuestions] = useState([]);
  const [selectedManualIds, setSelectedManualIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated / Final Questions List
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/paper-builder/meta")
      .then((res) => res.json())
      .then((data) => setMeta(data))
      .catch(() => toast.error("Could not fetch metadata"));
  }, []);

  useEffect(() => {
    if (mode === "manual") {
      fetch("http://localhost:8000/api/paper-builder/questions?approved_only=true")
        .then((res) => res.json())
        .then((data) => setManualQuestions(data))
        .catch(() => toast.error("Error fetching questions list"));
    }
  }, [mode]);

  const handleQuickGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:8000/api/paper-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...setup,
          blueprint
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedQuestions(data.questions);
        if (data.warnings && data.warnings.length > 0) {
          data.warnings.forEach((w) => toast.warning(w));
        }
        setStep(3);
        toast.success("Question paper generated successfully!");
      } else {
        toast.error("Failed to generate paper");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualProceed = () => {
    const chosen = manualQuestions.filter((q) => selectedManualIds.includes(q.id));
    setGeneratedQuestions(chosen);
    setStep(3);
    toast.success("Manual question paper selection locked!");
  };

  const handleToggleManualQuestion = (id) => {
    if (selectedManualIds.includes(id)) {
      setSelectedManualIds(selectedManualIds.filter((qId) => qId !== id));
    } else {
      setSelectedManualIds([...selectedManualIds, id]);
    }
  };

  const handleReplaceQuestion = async (currentId, chapter, questionType, marks) => {
    try {
      const res = await fetch("http://localhost:8000/api/paper-builder/replace-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_question_id: currentId,
          chapter,
          question_type: questionType,
          marks
        })
      });
      const replacement = await res.json();
      if (res.ok) {
        setGeneratedQuestions((prev) =>
          prev.map((q) => (q.id === currentId ? replacement : q))
        );
        toast.success("Question replaced successfully!");
      } else {
        toast.error(replacement.detail || "No suitable replacement available");
      }
    } catch (err) {
      toast.error("Error replacing question");
    }
  };

  const handleRemoveQuestion = (id) => {
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info("Question removed");
  };

  const handleAddInternalChoice = (id) => {
    const sampleAlt = {
      question_text: "Explain how customer needs can help an entrepreneur identify a business opportunity.",
      marks: 3,
      model_answer: "3 marks for logical explanation focusing on market gaps and customer utility."
    };

    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, internal_choice: sampleAlt } : q))
    );
    toast.success("Added OR internal choice question!");
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="print:hidden bg-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-widest mb-2">
              Cremson Test Builder Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              CBSE Question Paper Generator
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Build CBSE-compliant test papers, answer keys, and printable PDFs from verified question bank content.
            </p>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="print:hidden bg-white rounded-2xl p-4 shadow-sm border border-neutral-300">
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`p-3 rounded-xl border text-center font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                step === 1
                  ? "bg-slate-800 text-white border-slate-800"
                  : step > 1
                  ? "bg-neutral-100 text-neutral-900 border-neutral-300"
                  : "bg-neutral-50 text-neutral-400 border-neutral-200"
              }`}
            >
              <span>1. Setup Test</span>
              {step > 1 && <CheckCircle className="w-4 h-4 text-black" />}
            </div>

            <div
              className={`p-3 rounded-xl border text-center font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                step === 2
                  ? "bg-slate-800 text-white border-slate-800"
                  : step > 2
                  ? "bg-neutral-100 text-neutral-900 border-neutral-300"
                  : "bg-neutral-50 text-neutral-400 border-neutral-200"
              }`}
            >
              <span>2. Blueprint & Selection</span>
              {step > 2 && <CheckCircle className="w-4 h-4 text-black" />}
            </div>

            <div
              className={`p-3 rounded-xl border text-center font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                step === 3
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-neutral-50 text-neutral-400 border-neutral-200"
              }`}
            >
              <span>3. Review & Print</span>
            </div>
          </div>
        </div>

        {/* Workflow Screens */}
        {step === 1 && (
          <PaperSetupForm
            setup={setup}
            onChange={setSetup}
            onNext={() => setStep(2)}
            meta={meta}
          />
        )}

        {step === 2 && (
          <BlueprintSelector
            setup={setup}
            blueprint={blueprint}
            onBlueprintChange={setBlueprint}
            mode={mode}
            onModeChange={setMode}
            onQuickGenerate={handleQuickGenerate}
            onManualSelect={handleManualProceed}
            manualQuestions={manualQuestions}
            selectedManualIds={selectedManualIds}
            onToggleManualQuestion={handleToggleManualQuestion}
            isGenerating={isGenerating}
          />
        )}

        {step === 3 && (
          <PaperReview
            setup={setup}
            questions={generatedQuestions}
            onReplaceQuestion={handleReplaceQuestion}
            onRemoveQuestion={handleRemoveQuestion}
            onAddInternalChoice={handleAddInternalChoice}
            onBack={() => setStep(2)}
            manualBank={manualQuestions}
          />
        )}
      </div>
    </div>
  );
}
