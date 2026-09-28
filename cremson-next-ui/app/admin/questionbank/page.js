"use client";

import React, { useState, useEffect } from "react";
import { Plus, Upload, Download, CheckCircle2, Search, Database, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    class_name: "Class XII",
    subject: "Entrepreneurship",
    chapter: "Entrepreneurial Opportunity",
    topic: "",
    question_type: "Objective",
    objective_subtype: "Standard MCQ",
    difficulty: "Moderate",
    marks: 1,
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    model_answer: "",
    marking_scheme: "",
    competency_type: "Understand",
    verification_status: "Approved",
    active_status: true
  });

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/paper-builder/questions?approved_only=false");
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      toast.error("Failed to load question bank from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/paper-builder/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        toast.success("Question created successfully!");
        setShowAddModal(false);
        fetchQuestions();
      } else {
        toast.error("Error creating question");
      }
    } catch (err) {
      toast.error("Connection error");
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setImportResult(null);

    try {
      const res = await fetch("http://localhost:8000/api/paper-builder/admin/import-csv", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        toast.success(`CSV Imported: ${data.imported_count} questions added`);
        fetchQuestions();
      } else {
        toast.error("CSV import failed");
      }
    } catch (err) {
      toast.error("Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const headers = [
      "class", "subject", "chapter", "topic", "question_type", "objective_subtype",
      "difficulty", "marks", "question_text", "option_a", "option_b", "option_c",
      "option_d", "correct_answer", "model_answer", "marking_scheme",
      "competency_type", "source", "author", "verification_status", "active_status"
    ];
    const sampleRows = [
      // 1 Mark - Objective (MCQ)
      [
        "Class XII", "Entrepreneurship", "Entrepreneurial Opportunity", "Opportunity Recognition",
        "Objective", "Standard MCQ", "Easy", "1",
        "Which of the following best describes an entrepreneurial opportunity?",
        "Any idea that is personally interesting",
        "A viable possibility of creating value by meeting a need",
        "Any activity involving investment",
        "A business idea copied from an existing enterprise",
        "B", "Option (B) is correct. An entrepreneurial opportunity represents a viable possibility to create value.",
        "1 mark for selecting option (B).",
        "Understand", "Cremson Question Bank", "Cremson Editorial Team", "Approved", "Active"
      ],
      // 2 Marks - Very Short Answer
      [
        "Class XII", "Entrepreneurship", "Entrepreneurial Opportunity", "Entrepreneur Characteristics",
        "Very Short Answer", "", "Easy", "2",
        "State any two characteristics of a successful entrepreneur.",
        "", "", "", "", "",
        "Two key characteristics are:\n1. Risk-taking ability\n2. Innovation",
        "1 mark for each valid characteristic correctly stated (1 + 1 = 2 Marks).",
        "Remember", "Cremson Question Bank", "Cremson Editorial Team", "Approved", "Active"
      ],
      // 3 Marks - Short Answer
      [
        "Class XII", "Entrepreneurship", "Entrepreneurial Opportunity", "Entrepreneurial Functions",
        "Short Answer", "", "Moderate", "3",
        "Explain any three functions performed by an entrepreneur.",
        "", "", "", "", "",
        "1. Opportunity Identification: Spotting unmet market needs.\n2. Resource Mobilisation: Assembling capital and human talent.\n3. Risk Taking: Bearing financial uncertainties.",
        "1 mark for explaining each function clearly (1 x 3 = 3 Marks).",
        "Understand", "Cremson Question Bank", "Cremson Editorial Team", "Approved", "Active"
      ],
      // 5 Marks - Long Answer
      [
        "Class XII", "Entrepreneurship", "Entrepreneurial Opportunity", "Opportunity Assessment Process",
        "Long Answer", "", "Challenging", "5",
        "Explain the process an entrepreneur may follow from identifying a business idea to assessing whether it is a viable business opportunity.",
        "", "", "", "", "",
        "1. Idea Generation & Scanning\n2. Customer Need Assessment\n3. Market Research\n4. Financial Feasibility\n5. Commercial Viability Verification",
        "1 mark for each clearly explained sequential stage (5 Marks total).",
        "Analyse", "Cremson Question Bank", "Cremson Editorial Team", "Approved", "Active"
      ],
      // 5 Marks - Case-Based
      [
        "Class XII", "Entrepreneurship", "Entrepreneurial Opportunity", "Case Study on Opportunity Validation",
        "Case-Based", "", "Moderate", "5",
        "Read the following case carefully:\nRiya noticed that many students in her locality wanted affordable, healthy snacks during evening tuition classes. She observed existing options, spoke to students and parents, and found that customers were willing to pay for hygienically packed snacks delivered at a convenient time. She then compared suppliers, costs and possible selling prices before deciding whether the idea could become a sustainable venture.",
        "", "", "", "", "",
        "13(a) Opportunity recognition.\n13(b) Customer validation helps verify demand.\n13(c) Cost assessment determines commercial viability.",
        "Sub-question 13(a): 1 mark; 13(b): 2 marks; 13(c): 2 marks (5 Marks Total).",
        "Apply", "Cremson Question Bank", "Cremson Editorial Team", "Approved", "Active"
      ]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers.join(","),
      ...sampleRows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cremson_sample_question_bank_all_marks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV format with all question marks downloaded!");
  };

  const handleExportCSV = () => {
    if (questions.length === 0) {
      toast.error("No questions available to export");
      return;
    }
    const headers = [
      "id", "class_name", "subject", "chapter", "topic", "question_type", "objective_subtype",
      "difficulty", "marks", "question_text", "option_a", "option_b", "option_c",
      "option_d", "correct_answer", "model_answer", "marking_scheme",
      "competency_type", "source", "author", "verification_status", "active_status"
    ];
    const rows = questions.map((q) => [
      q.id || "",
      q.class_name || "",
      q.subject || "",
      q.chapter || "",
      q.topic || "",
      q.question_type || "",
      q.objective_subtype || "",
      q.difficulty || "",
      q.marks || 1,
      q.question_text || "",
      q.option_a || "",
      q.option_b || "",
      q.option_c || "",
      q.option_d || "",
      q.correct_answer || "",
      q.model_answer || "",
      q.marking_scheme || "",
      q.competency_type || "",
      q.source || "",
      q.author || "",
      q.verification_status || "",
      q.active_status ? "Active" : "Inactive"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(row => row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cremson_question_bank_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${questions.length} questions to CSV!`);
  };

  const filteredQuestions = questions.filter((q) => {
    if (chapterFilter && q.chapter !== chapterFilter) return false;
    if (typeFilter && q.question_type !== typeFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        q.question_text.toLowerCase().includes(term) ||
        q.chapter.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-100 text-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-black text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-neutral-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Database className="w-8 h-8 text-white" />
              Cremson Question Bank Management
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Admin panel for single question entry, verification status, and bulk CSV validation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadSampleCSV}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition flex items-center gap-1.5"
              title="Download formatted sample CSV file"
            >
              <Download className="w-4 h-4 text-white" /> Sample CSV Format
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition flex items-center gap-1.5"
              title="Export current question bank to CSV file"
            >
              <Download className="w-4 h-4 text-white" /> Export CSV
            </button>

            <label className="cursor-pointer px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-white" />
              {uploading ? "Importing..." : "Import CSV"}
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {/* CSV Import Summary Banner */}
        {importResult && (
          <div className="bg-white p-6 rounded-2xl border border-neutral-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200">
              <h3 className="font-bold text-black flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-black" /> CSV Validation & Import Summary
              </h3>
              <button onClick={() => setImportResult(null)} className="text-xs text-neutral-500 hover:text-black">
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-neutral-100 text-black border border-neutral-300 rounded-xl font-semibold">
                Imported: {importResult.imported_count} questions
              </div>
              <div className="p-3 bg-neutral-100 text-black border border-neutral-300 rounded-xl font-semibold">
                Skipped (Duplicates): {importResult.skipped_count} questions
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-300 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search question text or chapter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
          >
            <option value="">All Chapters</option>
            <option value="Entrepreneurial Opportunity">Entrepreneurial Opportunity</option>
            <option value="Business Planning">Business Planning</option>
            <option value="Enterprise Marketing">Enterprise Marketing</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
          >
            <option value="">All Question Types</option>
            <option value="Objective">Objective</option>
            <option value="Very Short Answer">Very Short Answer</option>
            <option value="Short Answer">Short Answer</option>
            <option value="Long Answer">Long Answer</option>
            <option value="Case-Based">Case-Based</option>
          </select>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-2xl border border-neutral-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 border-b border-neutral-300 text-black text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Type / Marks</th>
                  <th className="p-4">Chapter</th>
                  <th className="p-4">Question Text</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-neutral-50">
                    <td className="p-4">
                      <div className="font-bold text-black">{q.question_type}</div>
                      <div className="text-xs text-neutral-600 font-semibold">{q.marks} {q.marks === 1 ? "mark" : "marks"}</div>
                    </td>
                    <td className="p-4 text-xs font-medium text-black">{q.chapter}</td>
                    <td className="p-4 font-medium text-black max-w-md line-clamp-2">
                      {q.question_text}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-black border border-neutral-300">
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-black border border-neutral-300 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3.5 h-3.5 text-black" /> Approved
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-black border border-neutral-300">
            <h3 className="text-xl font-bold text-black">Add Question to Cremson Question Bank</h3>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-black uppercase">Question Type</label>
                  <select
                    value={newQuestion.question_type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value })}
                    className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
                  >
                    <option value="Objective">Objective</option>
                    <option value="Very Short Answer">Very Short Answer</option>
                    <option value="Short Answer">Short Answer</option>
                    <option value="Long Answer">Long Answer</option>
                    <option value="Case-Based">Case-Based</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black uppercase">Marks</label>
                  <input
                    type="number"
                    value={newQuestion.marks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-black uppercase">Chapter</label>
                <input
                  type="text"
                  value={newQuestion.chapter}
                  onChange={(e) => setNewQuestion({ ...newQuestion, chapter: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-black uppercase">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
                />
              </div>

              {newQuestion.question_type === "Objective" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <input
                    placeholder="Option A"
                    value={newQuestion.option_a}
                    onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                    className="p-2 border border-neutral-300 rounded"
                  />
                  <input
                    placeholder="Option B"
                    value={newQuestion.option_b}
                    onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                    className="p-2 border border-neutral-300 rounded"
                  />
                  <input
                    placeholder="Option C"
                    value={newQuestion.option_c}
                    onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                    className="p-2 border border-neutral-300 rounded"
                  />
                  <input
                    placeholder="Option D"
                    value={newQuestion.option_d}
                    onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                    className="p-2 border border-neutral-300 rounded"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-black uppercase">Model Answer</label>
                <textarea
                  rows={2}
                  value={newQuestion.model_answer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, model_answer: e.target.value })}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-sm bg-white text-black"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-black hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg text-sm font-bold shadow"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
