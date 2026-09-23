"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../../../lib/api/axios";
import { Search, BookOpen, CheckCircle2, Circle, Save, RefreshCw } from "lucide-react";

function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useState(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  });
  return d;
}

export default function AdminSpecimenBooks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Fetch all products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-all-products-specimen"],
    queryFn: async () => {
      const { data } = await api.get("/api/products/", { params: { size: 200 } });
      return data;
    },
  });

  // Fetch current specimen-eligible product IDs
  const { data: specimenData, isLoading: loadingSpecimen } = useQuery({
    queryKey: ["admin-specimen-books"],
    queryFn: async () => {
      const { data } = await api.get("/api/specimen-books/");
      return data;
    },
  });

  const allProducts = (productsData?.results ?? []).filter((p) => p.name);
  const enabledIds = new Set(specimenData?.product_ids ?? []);

  const filtered = search
    ? allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.author || "").toLowerCase().includes(search.toLowerCase()))
    : allProducts;

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (productId) => {
      const { data } = await api.patch(`/api/specimen-books/toggle/${productId}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin-specimen-books"], { product_ids: data.product_ids });
      toast.success(data.enabled ? "Book enabled for specimen requests." : "Book removed from specimen requests.");
    },
    onError: () => toast.error("Failed to update."),
  });

  const isLoading = loadingProducts || loadingSpecimen;

  return (
    <div className="p-4 sm:p-6 lg:p-8 text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 mt-0">Specimen Books Management</h2>
      <p className="text-sm text-gray-500 mb-8">Select which books are available for specimen requests. Only enabled books will appear on the user-facing specimen request page.</p>

      <div className="rounded-lg">
        <div className="h-[calc(100vh-160px)] flex flex-col">
          <div className="w-full h-full flex flex-col">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col flex-1 min-h-[600px]">

              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full sm:w-72"
                    />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-bold text-emerald-600">{enabledIds.size}</span> of{" "}
                      <span className="font-bold">{allProducts.length}</span> books enabled
                    </span>
                  </div>
                </div>
              </div>

              {/* Book list */}
              <div className="flex-1 overflow-auto min-h-0">
                {isLoading ? (
                  <div className="p-6 animate-pulse space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-base font-semibold text-gray-600">No books found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filtered.map((product) => {
                      const enabled = enabledIds.has(product.id);
                      const toggling = toggleMutation.isPending && toggleMutation.variables === product.id;
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${enabled ? "bg-emerald-50/40" : ""}`}
                        >
                          {/* Book cover thumbnail */}
                          <div className="w-10 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 border border-gray-200">
                            {product.main_image ? (
                              <img src={product.main_image} alt={product.name} className="w-full h-full object-cover object-top" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Book info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {product.author && <span>{product.author}</span>}
                              {product.classes && <span className="ml-2 text-gray-400">· Class {product.classes}</span>}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="flex-shrink-0">
                            {enabled ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1">
                                <CheckCircle2 className="w-3 h-3" /> Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1">
                                <Circle className="w-3 h-3" /> Disabled
                              </span>
                            )}
                          </div>

                          {/* Toggle button */}
                          <button
                            onClick={() => toggleMutation.mutate(product.id)}
                            disabled={toggling}
                            className={`flex-shrink-0 px-4 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              enabled
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50"
                            } disabled:opacity-50`}
                          >
                            {toggling ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : enabled ? (
                              "Remove"
                            ) : (
                              "Enable"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer summary */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
                <p className="text-xs text-gray-500">
                  Changes are saved instantly. Users will immediately see only enabled books on the specimen request page.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
