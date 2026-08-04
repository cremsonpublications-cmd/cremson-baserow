export async function generateStaticParams() {
  return [{ token: 'default' }];
}

import BulkOrderDetailClient from "./BulkOrderDetailClient";

export default function Page() {
  return <BulkOrderDetailClient />;
}
