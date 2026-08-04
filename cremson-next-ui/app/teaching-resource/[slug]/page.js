import api from "../../../lib/api/axios";
import TeachingResourceClient from "./TeachingResourceClient";

export async function generateStaticParams() {
  try {
    const { data } = await api.get("/api/teaching-resource-posts/");
    if (Array.isArray(data) && data.length > 0) {
      const slugs = data.map((p) => ({ slug: p.slug })).filter((item) => item.slug);
      if (slugs.length > 0) {
        if (!slugs.some((item) => item.slug === "default")) {
          slugs.push({ slug: "default" });
        }
        return slugs;
      }
    }
  } catch (error) {
    console.error("Error fetching teaching resource static params:", error);
  }
  return [{ slug: "default" }];
}

export default function Page() {
  return <TeachingResourceClient />;
}
