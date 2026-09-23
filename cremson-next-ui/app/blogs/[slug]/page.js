import api from "../../../lib/api/axios";
import BlogDetailClient from "./BlogDetailClient";

export async function generateStaticParams() {
  try {
    const { data } = await api.get("/api/blogs/?status=Published");
    if (Array.isArray(data) && data.length > 0) {
      const slugs = data.map((b) => ({ slug: b.slug })).filter((item) => item.slug);
      if (slugs.length > 0) {
        if (!slugs.some((item) => item.slug === "default")) {
          slugs.push({ slug: "default" });
        }
        return slugs;
      }
    }
  } catch (error) {
    console.error("Error fetching blog static params:", error);
  }
  return [{ slug: "default" }];
}

export default function Page() {
  return <BlogDetailClient />;
}
