"use client";

export const dynamic = "force-static";

import BlogDetailPage from "../../blogs/[slug]/page";

export default function BogsDetailPage({ params }) {
  return <BlogDetailPage params={params} />;
}
