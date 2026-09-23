import { fetchAllProducts } from "../../../../lib/api/products";
import AuthorPageClient from "./AuthorPageClient";

export function authorToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts();
    const authors = [
      ...new Set(products.map((p) => p.author).filter(Boolean)),
    ];
    return authors.map((a) => ({ slug: authorToSlug(a) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  try {
    const products = await fetchAllProducts();
    const authorName = products
      .map((p) => p.author)
      .find((a) => a && authorToSlug(a) === slug);

    if (!authorName) {
      return { title: "Author Not Found | Cremson Publications" };
    }

    const books = products.filter((p) => p.author === authorName);
    const title = `Books by ${authorName} | Cremson Publications`;
    const description = `Browse all ${books.length} books by ${authorName}. Buy educational textbooks online at Cremson Publications.`;
    const keywords = `${authorName}, ${authorName} books, ${authorName} textbook, ${books
      .map((b) => b.title)
      .slice(0, 5)
      .join(", ")}`;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: "website",
        images: books[0]?.image ? [{ url: books[0].image, alt: authorName }] : [],
      },
    };
  } catch {
    return { title: "Author Books | Cremson Publications" };
  }
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;

  let authorName = null;
  let books = [];

  try {
    const products = await fetchAllProducts();
    authorName = products
      .map((p) => p.author)
      .find((a) => a && authorToSlug(a) === slug);

    if (authorName) {
      books = products.filter((p) => p.author === authorName);
    }
  } catch {
    // fallback — client will fetch
  }

  return (
    <AuthorPageClient
      authorName={authorName}
      initialBooks={books}
      slug={slug}
    />
  );
}
