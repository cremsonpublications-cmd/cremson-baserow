"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Toaster } from "sonner";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";
import MobileMenuDrawer from "./MobileMenuDrawer";
import WhatsAppChatWidget from "./WhatsAppChatWidget";

// Routes that should render without the site Header/Footer/drawers
const STANDALONE_PREFIXES = ["/campaign"];

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const isStandalone = STANDALONE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isStandalone) {
    return (
      <>
        {children}
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
      </>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <CartDrawer />
      <WishlistDrawer />
      <MobileMenuDrawer />
      <WhatsAppChatWidget />
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
    </>
  );
}
