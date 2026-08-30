import ProductDetailClient from "./ProductDetailClient";
import { fetchProduct } from "../../../../lib/api/products";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  try {
    const book = await fetchProduct(id);
    if (!book) {
      return {
        title: "Product Not Found | Cremson Publications",
        description: "The requested book could not be found.",
      };
    }

    const title = `${book.title} by ${book.author} | Class ${book.class || "All"} Book`;
    const description = book.shortDescription || book.description || `Buy ${book.title} by ${book.author} online. High quality educational books by Cremson Publications.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "book",
        images: book.image ? [{ url: book.image, alt: book.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: book.image ? [book.image] : [],
      },
    };
  } catch (error) {
    return {
      title: "Book Details | Cremson Publications",
      description: "Buy quality educational books online from Cremson Publications.",
    };
  }
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  let book = null;
  let jsonLd = null;

  try {
    book = await fetchProduct(id);
    if (book) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "author": {
          "@type": "Person",
          "name": book.author
        },
        "isbn": book.isbn || undefined,
        "image": book.image || undefined,
        "description": book.description || book.shortDescription || undefined,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "INR",
          "price": book.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": book.stockStatus === "out_of_stock" 
            ? "https://schema.org/OutOfStock" 
            : "https://schema.org/InStock",
          "url": `https://cremsonpublications.com/shop/product/${id}`
        }
      };
    }
  } catch (error) {
    // Server fetch fallback
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient initialBook={book} bookId={id} />
    </>
  );
}
