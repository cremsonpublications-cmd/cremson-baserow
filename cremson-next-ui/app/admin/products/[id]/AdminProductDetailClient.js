"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getApiBaseUrl } from "../../../../lib/api/axios";

function BooleanBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function TagList({ value }) {
  let items = [];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    try { items = JSON.parse(value); } catch { items = [value]; }
  }
  if (!items.length) return <span className="text-gray-400 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {typeof item === "object" ? JSON.stringify(item) : String(item)}
        </span>
      ))}
    </div>
  );
}

function FieldValue({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return (
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
        <dd className="text-sm text-gray-400">—</dd>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
        <dd><BooleanBadge value={value} /></dd>
      </div>
    );
  }

  const arrayFields = ["sub_categories", "classes", "tags", "subjects", "boards"];
  const arrayField = arrayFields.some((f) => label.toLowerCase().includes(f.replace("_", " ")));
  if (arrayField && (Array.isArray(value) || typeof value === "string")) {
    return (
      <div className="flex flex-col gap-0.5">
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
        <dd><TagList value={value} /></dd>
      </div>
    );
  }

  if (label.toLowerCase() === "bulk pricing" && typeof value === "object") {
    return (
      <div className="flex flex-col gap-0.5 col-span-2">
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
        <dd>
          <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto border border-gray-200">
            {JSON.stringify(value, null, 2)}
          </pre>
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{String(value)}</dd>
    </div>
  );
}

function toLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductDetail() {
  const API = getApiBaseUrl();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [comboBooks, setComboBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/products/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProduct(data);

        // Fetch combo books if any
        let ids = [];
        if (data?.combo_product_ids) {
          try {
            const parsed = typeof data.combo_product_ids === "string" ? JSON.parse(data.combo_product_ids) : data.combo_product_ids;
            if (Array.isArray(parsed)) ids = parsed.map(String);
          } catch {}
        }
        if (ids.length === 0) {
          const combined = [data?.tags, data?.short_description, data?.description].filter(Boolean).join(" ");
          if (combined.includes("COMBO_IDS:")) {
            try {
              const raw = combined.split("COMBO_IDS:")[1].trim();
              const match = raw.match(/^\[(.*?)\]/);
              if (match) {
                ids = match[1].split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
              }
            } catch {}
          }
        }
        if (ids.length > 0) {
          const allRes = await fetch(`${API}/api/products/?size=200`);
          if (allRes.ok) {
            const allData = await allRes.json();
            const items = allData?.results ?? allData?.items ?? [];
            setComboBooks(items.filter((p) => ids.includes(String(p.id))));
          }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
          <div className="h-8 bg-gray-200 rounded w-64 mb-8" />
          <div className="bg-white rounded-xl shadow p-6 grid grid-cols-2 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link href="/admin/products" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6">
          ← Back to Products
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-semibold">Failed to load product</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const imageUrl = product.main_image || product.image || product.thumbnail;
  const ignoredKeys = ["main_image", "image", "thumbnail"];

  // Separate bulk_pricing for special rendering
  const bulkPricing = product.bulk_pricing;

  // Build field list
  const fields = Object.entries(product).filter(([k]) => !ignoredKeys.includes(k) && k !== "bulk_pricing");

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/admin/products" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6 w-fit">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </Link>

      {/* Title */}
      <div className="flex items-start gap-4 mb-8">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-24 h-32 object-contain bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name || `Product #${id}`}</h1>
          {product.id && <p className="text-sm text-gray-400 font-mono mt-1">ID: {product.id}</p>}
        </div>
      </div>

      {/* Image (large display) */}
      {imageUrl && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Main Image</h2>
          <img
            src={imageUrl}
            alt={product.name}
            className="max-h-64 object-contain rounded-lg"
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
          <p className="text-xs text-gray-400 mt-2 break-all">{imageUrl}</p>
        </div>
      )}

      {/* Fields Grid */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">Product Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {fields.map(([key, value]) => (
            <FieldValue key={key} label={toLabel(key)} value={value} />
          ))}
        </dl>
      </div>

      {/* Combo Bundle Included Books */}
      {comboBooks.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            📦 Included Books in this Combo Bundle ({comboBooks.length})
          </h2>
          <div className="space-y-3">
            {comboBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  {book.main_image ? (
                    <img src={book.main_image} alt={book.name} className="w-12 h-14 object-cover rounded-lg border bg-white" />
                  ) : (
                    <div className="w-12 h-14 bg-gray-200 rounded-lg border flex items-center justify-center text-gray-400">
                      📖
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{book.name}</h3>
                    {book.author && <p className="text-xs text-gray-500">by {book.author}</p>}
                    {book.sku && <p className="text-[10px] text-gray-400 font-mono mt-0.5">SKU: {book.sku}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">₹{book.price || book.mrp || 0}</div>
                  {book.mrp && Number(book.mrp) > Number(book.price || 0) && (
                    <div className="text-xs text-gray-400 line-through">₹{book.mrp}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Pricing */}
      {bulkPricing && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Bulk Pricing</h2>
          <pre className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 overflow-x-auto border border-gray-200">
            {typeof bulkPricing === "string" ? bulkPricing : JSON.stringify(bulkPricing, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
