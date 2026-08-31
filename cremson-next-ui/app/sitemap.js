import { fetchAllProducts } from "../lib/api/products";

export const dynamic = "force-static";

export default async function sitemap() {
  const baseUrl = "https://cremsonpublications.com";

  const staticRoutes = [
    { url: `${baseUrl}`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/specimen`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact-us`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/blogs`, changeFrequency: "weekly", priority: 0.7 },
  ].map((r) => ({ ...r, lastModified: new Date() }));

  // Add all active product pages
  let productRoutes = [];
  try {
    const products = await fetchAllProducts();
    productRoutes = (products || [])
      .filter((p) => p.id)
      .map((p) => ({
        url: `${baseUrl}/shop/product/${p.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch products:", err);
  }

  return [...staticRoutes, ...productRoutes];
}
