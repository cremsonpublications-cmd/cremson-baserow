import "./globals.css";
import { Toaster } from "sonner";
import { AppProvider } from "../context/AppContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import WishlistDrawer from "../components/WishlistDrawer";
import MobileMenuDrawer from "../components/MobileMenuDrawer";
import QueryProvider from "../lib/providers/QueryProvider";

export const metadata = {
  title: {
    default: "Cremson Publications | Best Educational Books & Reference Materials",
    template: "%s | Cremson Publications",
  },
  description:
    "Discover quality educational books and publications that enhance learning and inspire knowledge. From textbooks to reference materials and lab manuals.",
  keywords: [
    "educational books",
    "textbooks",
    "reference materials",
    "lab manuals",
    "cremson publications",
    "school books",
    "CBSE books"
   
  ],
  authors: [{ name: "Cremson Publications", url: "https://cremsonpublications.com" }],
  creator: "Cremson Publications",
  publisher: "Cremson Publications",
  metadataBase: new URL("https://cremsonpublications.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon.png",
  },
  openGraph: {
    title: "Cremson Publications | Best Educational Books & Reference Materials",
    description:
      "Discover quality educational books and publications that enhance learning and inspire knowledge.",
    url: "https://cremsonpublications.com",
    siteName: "Cremson Publications",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Cremson Publications – Quality Educational Books",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cremson Publications | Best Educational Books & Reference Materials",
    description:
      "Discover quality educational books and publications that enhance learning and inspire knowledge.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans antialiased text-black bg-white flex flex-col min-h-screen" suppressHydrationWarning>
        <QueryProvider>
          <AppProvider>
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <WishlistDrawer />
            <MobileMenuDrawer />
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              visibleToasts={1}
              toastOptions={{
                duration: 3500,
                style: { fontFamily: "inherit" },
              }}
            />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
