"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border border-gray-100 bg-white shadow-red-100/50">
      {toast.type === "success" ? (
        <CheckCircle2 className="text-green-500 h-6 w-6 flex-shrink-0" />
      ) : toast.type === "error" ? (
        <AlertCircle className="text-red-500 h-6 w-6 flex-shrink-0" />
      ) : (
        <AlertCircle className="text-blue-500 h-6 w-6 flex-shrink-0" />
      )}
      <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
    </div>
  );
}
