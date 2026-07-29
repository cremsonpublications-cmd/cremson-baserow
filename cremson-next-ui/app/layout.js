import "./globals.css";
import { Toaster } from "sonner";
import { AppProvider } from "../context/AppContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import WishlistDrawer from "../components/WishlistDrawer";
import QueryProvider from "../lib/providers/QueryProvider";

export const metadata = {
  title: "Cremson Publications | Best Educational Books & Reference Materials",
  description: "Discover quality educational books and publications that enhance learning and inspire knowledge. From textbooks to reference materials and lab manuals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased text-black bg-white flex flex-col min-h-screen">
        <QueryProvider>
          <AppProvider>
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <WishlistDrawer />
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
