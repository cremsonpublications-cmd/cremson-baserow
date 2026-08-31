import api from "./axios";

function parseArr(val) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export function mapProduct(p) {
  let subCats = [];
  if (p.sub_categories) {
    if (typeof p.sub_categories === "string") {
      const trimmed = p.sub_categories.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          subCats = JSON.parse(trimmed);
        } catch {
          subCats = trimmed.slice(1, -1).split(",").map(s => s.trim().replace(/['"]/g, "")).filter(Boolean);
        }
      } else if (trimmed) {
        subCats = trimmed.split(",").map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(p.sub_categories)) {
      subCats = p.sub_categories;
    }
  }
  const classes = parseArr(p.classes);
  const mrp = parseFloat(p.mrp) || 0;
  const discountPct = parseFloat(p.own_discount_percentage) || 0;
  const hasDiscount = p.has_own_discount && discountPct > 0;
  const price = hasDiscount ? Math.round(mrp * (1 - discountPct / 100)) : mrp;

  const rawCombo = p.combo_product_ids || p.combo_products;
  let comboProductIds = [];
  if (rawCombo) {
    try {
      comboProductIds = typeof rawCombo === "string" ? JSON.parse(rawCombo) : rawCombo;
    } catch {
      comboProductIds = String(rawCombo).split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  const tagsStr = typeof p.tags === "string" ? p.tags : (Array.isArray(p.tags) ? p.tags.join(" ") : "");
  const combined = [tagsStr, p.short_description, p.description].filter(Boolean).join(" ");
  if ((!Array.isArray(comboProductIds) || comboProductIds.length === 0) && combined.includes("COMBO_IDS:")) {
    try {
      const raw = combined.split("COMBO_IDS:")[1].trim();
      const match = raw.match(/^\[(.*?)\]/);
      if (match) {
        comboProductIds = match[1].split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
      }
    } catch {}
  }

  const isCombo = Boolean(
    p.is_combo ||
    (Array.isArray(comboProductIds) && comboProductIds.length > 0) ||
    p.author === "Cremson Bundle" ||
    combined.includes("COMBO_IDS:") ||
    tagsStr.toLowerCase().includes("combo")
  );

  return {
    id: p.id,
    title: p.name || "",
    author: p.author || "",
    class: classes[0] || "",
    classes,
    categoryId: p.category_id || null,
    mainCategory: p.category || "",
    category: subCats[0] || "",
    subCategories: subCats,
    price,
    originalPrice: hasDiscount ? mrp : null,
    discount: hasDiscount ? `${discountPct}%` : null,
    rating: parseFloat(p.rating) || 0,
    reviewsCount: parseInt(p.review_count) || 0,
    image: p.main_image || "",
    sideImages: parseArr(p.side_images),
    stockStatus: (() => {
      let raw = p.stock_status;
      if (raw && typeof raw === "object") raw = raw.value;
      if (raw) {
        const s = String(raw).toLowerCase().replace(/\s+/g, "_");
        if (s.includes("out") || s === "out_of_stock") return "out_of_stock";
        if (s.includes("backorder") || s === "on_backorders") return "on_backorders";
        return "in_stock";
      }
      const rawStatus = String(p.status || "").toLowerCase().replace(/\s+/g, "_");
      if (rawStatus.includes("out") || rawStatus === "out_of_stock") return "out_of_stock";
      if (rawStatus.includes("backorder") || rawStatus === "on_backorders") return "on_backorders";
      return "in_stock";
    })(),
    status: p.status || "",
    isbn: p.isbn || "",
    edition: p.edition || "",
    description: p.description || "",
    shortDescription: p.short_description || "",
    weight: p.weight || "",
    dimension: p.dimension || "",
    isActive: p.is_active,
    tags: parseArr(p.tags),
    bulkPricing: (() => { try { return JSON.parse(p.bulk_pricing || "[]"); } catch { return []; } })(),
    isCombo,
    comboProductIds: Array.isArray(comboProductIds) ? comboProductIds.map(String) : [],
    displayOrder: p.display_order ?? 999999,
  };
}

export async function fetchProducts(params = {}) {
  const { data } = await api.get("/api/products/", { params: { is_active: true, ...params } });
  const results = (data.results || []).filter((p) => p.name).map(mapProduct);
  return { count: data.count || 0, results };
}

export async function fetchAllProducts(params = {}) {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const { data } = await api.get("/api/products/", {
      params: { size: 200, page, is_active: true, ...params }
    });
    const results = data.results || [];
    allResults = [...allResults, ...results];

    if (data.next && results.length === 200) {
      page += 1;
    } else {
      hasNext = false;
    }
  }

  return allResults.filter((p) => p.name).map(mapProduct);
}

export async function fetchProduct(id) {
  const { data } = await api.get(`/api/products/${id}`);
  return mapProduct(data);
}
