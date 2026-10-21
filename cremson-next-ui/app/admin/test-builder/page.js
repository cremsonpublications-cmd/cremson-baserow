"use client";

import React, { useState, useEffect } from "react";
import PaperSetupForm from "../../question-paper-generator/PaperSetupForm";
import BlueprintSelector from "../../question-paper-generator/BlueprintSelector";
import PaperReview from "../../question-paper-generator/PaperReview";
import { toast } from "sonner";
import { CheckCircle, FlaskConical } from "lucide-react";
import api from "@/lib/api/axios";

export default function AdminTestBuilderPage() {
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState({
    classes: ["Class XII"],
    subjects: ["Entrepreneurship"],
    chapters: ["Entrepreneurial Opportunity", "Business Planning", "Enterprise Marketing"],
    question_types: ["Objective", "Very Short Answer", "Short Answer", "Long Answer", "Case-Based"]
  });

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

  const [blueprint, setBlueprint] = useState([
    { question_type: "Objective", quantity: 5, marks_each: 1 },
    { question_type: "Very Short Answer", quantity: 3, marks_each: 2 },
    { question_type: "Short Answer", quantity: 3, marks_each: 3 },
    { question_type: "Long Answer", quantity: 1, marks_each: 5 },
    { question_type: "Case-Based", quantity: 1, marks_each: 5 }
  ]);

  const [mode, setMode] = useState("quick");
  const [manualQuestions, setManualQuestions] = useState([]);
  const [selectedManualIds, setSelectedManualIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  useEffect(() => {
    api.get("/api/paper-builder/meta")
      .then((res) => setMeta(res.data))
      .catch(() => toast.error("Could not fetch metadata"));
  }, []);

  useEffect(() => {
    if (mode === "manual") {
      api.get("/api/paper-builder/questions?approved_only=true")
        .then((res) => setManualQuestions(res.data))
        .catch(() => toast.error("Error fetching questions list"));
    }
  }, [mode]);

  const handleQuickGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post("/api/paper-builder/generate", { ...setup, blueprint });
      const data = res.data;
      setGeneratedQuestions(data.questions);
      if (data.warnings?.length > 0) data.warnings.forEach((w) => toast.warning(w));
      setStep(3);
      toast.success("Question paper generated successfully!");
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualProceed = () => {
    if (selectedManualIds.length === 0) {
      toast.error("Please select at least one question.");
      return;
    }
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
      const res = await api.post("/api/paper-builder/replace-question", {
        current_question_id: currentId,
        chapter,
        question_type: questionType,
        marks
      });
      setGeneratedQuestions((prev) => prev.map((q) => (q.id === currentId ? res.data : q)));
      toast.success("Question replaced successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No suitable replacement available");
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
    <div className="p-6 md:p-8 min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical size={22} className="text-red-700" />
          <h1 className="text-2xl font-extrabold text-gray-900">Test Builder</h1>
        </div>
        <p className="text-sm text-gray-500 ml-9">
          Build CBSE-compliant question papers from the verified question bank.
        </p>
      </div>

      {/* Step Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: 1, label: "Setup Test" },
            { n: 2, label: "Blueprint & Selection" },
            { n: 3, label: "Review & Print" },
          ].map(({ n, label }) => (
            <div
              key={n}
              className={`p-3 rounded-xl border text-center font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                step === n
                  ? "bg-red-700 text-white border-red-700"
                  : step > n
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-gray-50 text-gray-400 border-gray-200"
              }`}
            >
              <span>{n}. {label}</span>
              {step > n && <CheckCircle className="w-4 h-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Steps */}
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
          onBack={() => setStep(1)}
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
  );
}
