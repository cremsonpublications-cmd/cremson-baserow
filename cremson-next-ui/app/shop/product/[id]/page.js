import ProductDetailClient from "./ProductDetailClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function parseArr(val) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function mapProduct(p) {
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

async function fetchProductServer(id) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.cremsonpublications.com";
  try {
    const res = await fetch(`${apiUrl}/api/products/${id}`, {
      next: { revalidate: 0 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return mapProduct(data);
  } catch (error) {
    console.error("Failed to fetch product on server:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  try {
    const book = await fetchProductServer(id);
    if (!book) {
      return {
        title: "Product Not Found | Cremson Publications",
        description: "The requested book could not be found.",
      };
    }

    const title = `${book.title} by ${book.author} | Class ${book.class || "All"} Book`;
    const description = book.shortDescription || book.description || `Buy ${book.title} by ${book.author} online. High quality educational books by Cremson Publications.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "book",
        images: book.image ? [{ url: book.image, alt: book.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: book.image ? [book.image] : [],
      },
    };
  } catch (error) {
    return {
      title: "Book Details | Cremson Publications",
      description: "Buy quality educational books online from Cremson Publications.",
    };
  }
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  let book = null;
  let jsonLd = null;

  try {
    book = await fetchProductServer(id);
    if (book) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": {
          "@type": "Person",
          "name": book.author
        },
        "isbn": book.isbn || undefined,
        "image": book.image || undefined,
        "description": book.description || book.shortDescription || undefined,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": book.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": book.stockStatus === "out_of_stock" 
            ? "https://schema.org/OutOfStock" 
            : "https://schema.org/InStock",
          "url": `https://cremsonpublications.com/shop/product/${id}`
        }
      };
    }
  } catch (error) {
    // Server fetch fallback
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient initialBook={book} bookId={id} />
    </>
  );
}
