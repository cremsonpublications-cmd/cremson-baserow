export async function generateStaticParams() {
  return Array.from({ length: 200 }, (_, i) => ({ id: String(i + 1) }));
}

import AdminProductDetailClient from "./AdminProductDetailClient";

export default function Page() {
  return <AdminProductDetailClient />;
}
