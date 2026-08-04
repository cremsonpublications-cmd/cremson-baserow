export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

import TeachingResourceClient from "./TeachingResourceClient";

export default function Page() {
  return <TeachingResourceClient />;
}
