"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

/**
 * Manages the Chatwoot live-chat bubble.
 *
 * - Not logged in  → bubble is hidden; a "Chat with us" button is shown
 *   that redirects to login when clicked.
 * - Logged in      → bubble is visible and the user is auto-identified
 *   (name, email, phone) so agents see who they're talking to.
 */
export default function ChatwootWidget() {
  const { user } = useApp();
  const router = useRouter();
  const chatwootReady = useRef(false);

  // ── Identify / reset user whenever auth state changes ──────────────────────
  useEffect(() => {
    const applyIdentity = () => {
      if (!window.$chatwoot) return;
      chatwootReady.current = true;

      if (user?.id) {
        // Normalise phone to +91XXXXXXXXXX
        let phone = user.phone ? String(user.phone).replace(/\D/g, "") : "";
        if (phone.length === 10) phone = "91" + phone;
        if (phone) phone = "+" + phone;

        window.$chatwoot.setUser(String(user.id), {
          name: user.name || "",
          email: user.email || "",
          ...(phone ? { phone_number: phone } : {}),
        });
        window.$chatwoot.toggleBubbleVisibility("show");
      } else {
        try {
          window.$chatwoot.reset();
        } catch (_) {}
        window.$chatwoot.toggleBubbleVisibility("hide");
      }
    };

    window.addEventListener("chatwoot:ready", applyIdentity);
    // Also run immediately in case the SDK was already loaded
    if (chatwootReady.current) applyIdentity();

    return () => window.removeEventListener("chatwoot:ready", applyIdentity);
  }, [user]);

  // ── "Login to Chat" floating button (shown only when NOT logged in) ────────
  if (user) return null;

  return (
    <button
      aria-label="Chat with us — login required"
      onClick={() => {
        toast.info("Please login to chat with us");
        router.push("/auth/signin");
      }}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-[#1F93FF] hover:bg-[#1a80e0] transition-colors"
    >
      {/* Chat bubble icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-7 h-7"
      >
        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.854 2.67 2.94 1.243.065 2.496.12 3.758.17l2.782 2.093a.75.75 0 0 0 1.24-.556v-2.17c1.405-.39 2.43-1.652 2.43-3.13v-4.287c0-1.506-1.124-2.852-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
      </svg>
    </button>
  );
}
