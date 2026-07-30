import api from "./axios";

function parseArr(val) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

export function mapProduct(p) {
  const subCats = parseArr(p.sub_categories);
  const classes = parseArr(p.classes);
  const mrp = parseFloat(p.mrp) || 0;
  const discountPct = parseFloat(p.own_discount_percentage) || 0;
  const hasDiscount = p.has_own_discount && discountPct > 0;
  const price = hasDiscount ? Math.round(mrp * (1 - discountPct / 100)) : mrp;

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
    discount: hasDiscount ? `-${discountPct}%` : null,
    rating: parseFloat(p.rating) || 0,
    reviewsCount: parseInt(p.review_count) || 0,
    image: p.main_image || "",
    sideImages: parseArr(p.side_images),
    stockStatus: p.stock_status || "in_stock",
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
  };
}

export async function fetchAllProducts(params = {}) {
  let allResults = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const { data } = await api.get("/api/products/", {
      params: { size: 200, page, ...params }
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
