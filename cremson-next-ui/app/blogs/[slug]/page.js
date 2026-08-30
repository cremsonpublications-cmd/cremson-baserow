import BlogDetailClient from "./BlogDetailClient";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function Page() {
  return <BlogDetailClient />;
}
