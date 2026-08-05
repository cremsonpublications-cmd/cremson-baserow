export async function generateStaticParams() {
  return [{ token: 'placeholder' }];
}

import BulkOrderDetailClient from "./BulkOrderDetailClient";

export default function Page() {
  return <BulkOrderDetailClient />;
}
