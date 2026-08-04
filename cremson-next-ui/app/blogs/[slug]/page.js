export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

import BlogDetailClient from "./BlogDetailClient";

export default function Page() {
  return <BlogDetailClient />;
}
