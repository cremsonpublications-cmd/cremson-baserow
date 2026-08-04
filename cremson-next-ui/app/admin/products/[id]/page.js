export async function generateStaticParams() {
  return [{ id: '1' }];
}

import AdminProductDetailClient from "./AdminProductDetailClient";

export default function Page() {
  return <AdminProductDetailClient />;
}
