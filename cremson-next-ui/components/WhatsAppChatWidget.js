"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { getMyOrders } from "../lib/api/orders";
import { getTeacherStatus } from "../lib/api/auth";
import whatsappIcon from "../images/whatsapp.png";

const WHATSAPP_NUMBER = "917982645175";

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function renderMessageText(text) {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#027eb5" }}
          className="hover:underline break-all font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

const INITIAL_BOT_MESSAGE = {
  id: "msg_init",
  sender: "bot",
  text: `👋 Welcome to Cremson Publications! 📚\n\nHow can we assist you today? Select an option below to start your chat with our automated WhatsApp flow:`,
  options: [
    { id: "1", title: "1️⃣ Teachers Section" },
    { id: "2", title: "2️⃣ Buy Books" },
    { id: "3", title: "3️⃣ Track Your Order" },
    { id: "4", title: "4️⃣ Request Specimen Copy" },
    { id: "5", title: "5️⃣ Bulk Order Inquiry" },
    { id: "6", title: "6️⃣ Contact Support" },
  ],
  timestamp: getCurrentTime(),
};

export default function WhatsAppChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([INITIAL_BOT_MESSAGE]);
  const [awaitingPhone, setAwaitingPhone] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  if (pathname?.startsWith("/admin")) return null;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hasUnread) setHasUnread(false);
  };

  const openExternalWhatsApp = (text) => {
    const message = text || "Hi";
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleLinkClick = (url) => {
    if (url.startsWith("http") || url.startsWith("tel:") || url.startsWith("mailto:")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
      setIsOpen(false);
    }
  };

  const processUserMessage = async (userText) => {
    const cleanText = userText.trim();
    const lowerText = cleanText.toLowerCase();

    const userMsgObj = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setIsTyping(true);

    // Realistic typing delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));

    let botResponse = null;

    const isMenuKeywordOrOption = 
      ["hi", "hello", "start", "menu", "main", "main menu"].includes(lowerText) ||
      cleanText.startsWith("1") || lowerText.includes("teacher") ||
      cleanText.startsWith("2") || lowerText.includes("buy") || lowerText.includes("shop") ||
      cleanText.startsWith("3") || lowerText.includes("track") ||
      cleanText.startsWith("4") || lowerText.includes("specimen") ||
      cleanText.startsWith("5") || lowerText.includes("bulk") ||
      cleanText.startsWith("6") || lowerText.includes("support") || lowerText.includes("contact");

    try {
      if (isMenuKeywordOrOption) {
        setAwaitingPhone(false);
      }

      if (awaitingPhone && !isMenuKeywordOrOption) {
        const cleanedPhone = cleanText.replace(/\D/g, "");
        if (cleanedPhone.length === 10) {
          setAwaitingPhone(false);
          localStorage.setItem("cremson_phone", cleanedPhone);
          try {
            const statusData = await getTeacherStatus(cleanedPhone);
            if (statusData.status === "verified") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: statusData.message,
                links: [
                  { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else if (statusData.status === "pending") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: statusData.message,
                links: [
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `We couldn't find a registered teacher account linked to your WhatsApp phone number (+91 ${cleanedPhone}). ⚠️\n\nWould you like to register now as a new teacher?\n\nReply:\nB) Register as New Teacher\n\nOr request specimen copies directly on our website:\nhttps://cremsonpublications.com/specimen`,
                options: [
                  { id: "reg_no", title: "2️⃣ Unregistered / New Teacher" }
                ],
                links: [
                  { title: "🌐 Register as Teacher", url: "/auth/teacher-signup" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            }
          } catch (apiErr) {
            console.error(apiErr);
            botResponse = {
              id: `bot_${Date.now()}`,
              sender: "bot",
              text: `Welcome back! Your teacher portal is active. 🎉\n\n📥 Download Answer Keys, Lesson Plans & Question Banks:\nhttps://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen\n\nType 'Menu' anytime to go back.`,
              links: [
                { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                { title: "📚 Request Free Specimen Copies", url: "/specimen" },
              ],
              timestamp: getCurrentTime(),
            };
          }
        } else {
          botResponse = {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: `⚠️ Please enter a valid 10-digit WhatsApp phone number (e.g., 9876543210):`,
            timestamp: getCurrentTime(),
          };
        }
      } else if (["hi", "hello", "start", "menu", "main", "main menu"].includes(lowerText)) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `👋 Welcome to Cremson Publications! 📚\n\nHow can we assist you today?`,
          options: INITIAL_BOT_MESSAGE.options,
          timestamp: getCurrentTime(),
        };
      } else if (cleanText.startsWith("1") || lowerText.includes("teacher")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Great to have you here, Educator! 🎓\nWe provide answer keys, lesson plans, and free specimen copies to verified teachers.\n\nAre you currently registered with Cremson Publications?`,
          options: [
            { id: "reg_yes", title: "1️⃣ Registered Teacher" },
            { id: "reg_no", title: "2️⃣ Unregistered / New Teacher" },
          ],
          timestamp: getCurrentTime(),
        };
      } else if (lowerText.includes("registered teacher") || lowerText.includes("reg_yes")) {
        const storedPhone = localStorage.getItem("cremson_phone");
        if (storedPhone) {
          const cleanedPhone = storedPhone.replace(/\D/g, "");
          try {
            const statusData = await getTeacherStatus(cleanedPhone);
            if (statusData.status === "verified") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: statusData.message,
                links: [
                  { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else if (statusData.status === "pending") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: statusData.message,
                links: [
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `We couldn't find a registered teacher account linked to your WhatsApp phone number (+91 ${cleanedPhone}). ⚠️\n\nWould you like to register now as a new teacher?\n\nReply:\nB) Register as New Teacher\n\nOr request specimen copies directly on our website:\nhttps://cremsonpublications.com/specimen`,
                options: [
                  { id: "reg_no", title: "2️⃣ Unregistered / New Teacher" }
                ],
                links: [
                  { title: "🌐 Register as Teacher", url: "/auth/teacher-signup" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            }
          } catch (apiErr) {
            console.error(apiErr);
            botResponse = {
              id: `bot_${Date.now()}`,
              sender: "bot",
              text: `Welcome back! Your teacher portal is active. 🎉\n\n📥 Download Answer Keys, Lesson Plans & Question Banks:\nhttps://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen\n\nType 'Menu' anytime to go back.`,
              links: [
                { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                { title: "📚 Request Free Specimen Copies", url: "/specimen" },
              ],
              timestamp: getCurrentTime(),
            };
          }
        } else {
          setAwaitingPhone(true);
          botResponse = {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: `Please enter your registered 10-digit mobile/WhatsApp number to verify your teacher status: 📞`,
            timestamp: getCurrentTime(),
          };
        }
      } else if (lowerText.includes("new teacher") || lowerText.includes("reg_no")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Awesome! You can register as a verified teacher on our website here:\n\n🌐 Teacher Registration Link:\nhttps://cremsonpublications.com/auth/teacher-signup\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen`,
          links: [
            { title: "🌐 Teacher Signup Form", url: "/auth/teacher-signup" },
            { title: "📚 Request Specimen Copy", url: "/specimen" },
          ],
          timestamp: getCurrentTime(),
        };
      } else if (cleanText.startsWith("2") || lowerText.includes("buy") || lowerText.includes("shop")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `📚 Cremson Books Store\n\nBrowse our online book catalog or place bulk orders for your school:`,
          links: [
            { title: "🛍️ Browse Online Shop", url: "/shop" },
            { title: "📋 Bulk Order Inquiry", url: "/bulk-order" },
          ],
          timestamp: getCurrentTime(),
        };
      } else if (cleanText.startsWith("3") || lowerText.includes("track")) {
        if (!user) {
          botResponse = {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: `Let's find your package! 📦\n\nPlease sign in to your Cremson account to track your orders`,
            links: [
              { title: "🔑 Sign In First to View Orders", url: "/auth/signin?redirect=/my-orders" },
            ],
            timestamp: getCurrentTime(),
          };
        } else {
          try {
            const userOrders = await getMyOrders(user.email);
            if (userOrders && userOrders.length > 0) {
              const latestOrder = userOrders[0];
              const orderSummaryText = userOrders
                .slice(0, 3)
                .map((o) => `• Order #${o.id} — ${o.status || "Order Placed"} (${o.date || "Recent"})`)
                .join("\n");
              const linksList = [{ title: "📦 View All My Orders", url: "/my-orders" }];
              if (latestOrder.trackingUrl) {
                linksList.unshift({ title: "🚚 Track Latest Shipment", url: latestOrder.trackingUrl });
              }
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `Welcome back, ${user.name || user.email.split("@")[0]}! 📦\n\nYour recent orders:\n${orderSummaryText}`,
                links: linksList,
                timestamp: getCurrentTime(),
              };
            } else {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `Hello ${user.name || user.email.split("@")[0]}! 📦\n\nNo orders found under ${user.email} yet.\n\nIf you placed a guest order, type your Order ID or mobile number below:`,
                links: [
                  { title: "🛍️ Browse Shop", url: "/shop" },
                  { title: "📦 My Orders Page", url: "/my-orders" },
                ],
                timestamp: getCurrentTime(),
              };
            }
          } catch (err) {
            console.error("Failed to fetch user orders for widget:", err);
            botResponse = {
              id: `bot_${Date.now()}`,
              sender: "bot",
              text: `Welcome back! 📦\n\nView and track all your orders on your Orders page:`,
              links: [{ title: "📦 View My Orders Page", url: "/my-orders" }],
              timestamp: getCurrentTime(),
            };
          }
        }
      } else if (cleanText.startsWith("4") || lowerText.includes("specimen")) {
        const storedPhone = localStorage.getItem("cremson_phone");
        if (storedPhone) {
          const cleanedPhone = storedPhone.replace(/\D/g, "");
          try {
            const statusData = await getTeacherStatus(cleanedPhone);
            if (statusData.status === "verified") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `We provide free specimen copies to school teachers for evaluation purposes. 📚\n\n${statusData.message}`,
                links: [
                  { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else if (statusData.status === "pending") {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `We provide free specimen copies to school teachers for evaluation purposes. 📚\n\n${statusData.message}`,
                links: [
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            } else {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `We provide free specimen copies to school teachers for evaluation purposes. 📚\n\nWe couldn't find a registered teacher account linked to your WhatsApp phone number (+91 ${cleanedPhone}). ⚠️\n\nWould you like to register now as a new teacher?\n\nReply:\nB) Register as New Teacher\n\nOr request specimen copies directly on our website:\nhttps://cremsonpublications.com/specimen`,
                options: [
                  { id: "reg_no", title: "2️⃣ Unregistered / New Teacher" }
                ],
                links: [
                  { title: "🌐 Register as Teacher", url: "/auth/teacher-signup" },
                  { title: "📚 Request Free Specimen Copies", url: "/specimen" },
                ],
                timestamp: getCurrentTime(),
              };
            }
          } catch (apiErr) {
            console.error(apiErr);
            botResponse = {
              id: `bot_${Date.now()}`,
              sender: "bot",
              text: `We provide free specimen copies to school teachers for evaluation purposes. 📚\n\nWelcome back! Your teacher portal is active. 🎉\n\n📥 Download Answer Keys, Lesson Plans & Question Banks:\nhttps://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link\n\n📚 Request Free Specimen Copies:\nhttps://cremsonpublications.com/specimen\n\nType 'Menu' anytime to go back.`,
              links: [
                { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
                { title: "📚 Request Free Specimen Copies", url: "/specimen" },
              ],
              timestamp: getCurrentTime(),
            };
          }
        } else {
          botResponse = {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: `We provide free specimen copies to school teachers for evaluation purposes. 📚\n\nAre you currently registered with Cremson Publications?`,
            options: [
              { id: "reg_yes", title: "1️⃣ Registered Teacher" },
              { id: "reg_no", title: "2️⃣ Unregistered / New Teacher" },
            ],
            timestamp: getCurrentTime(),
          };
        }
      } else if (cleanText.startsWith("5") || lowerText.includes("bulk")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `That's wonderful news! 🎉\nThank you for choosing Cremson Publications for this session! 🙏\n\nSelect an option below to proceed:`,
          links: [
            { title: "🛍️ Browse Shop", url: "/shop" },
            { title: "📋 Fill Bulk Order Form", url: "/bulk-order" },
          ],
          timestamp: getCurrentTime(),
        };
      } else if (cleanText.startsWith("6") || lowerText.includes("support") || lowerText.includes("contact")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `📞 Cremson Publications — Contact Us\n\n🕐 Office Hours: Mon–Sat, 10:00 AM – 6:00 PM\n\n📱 WhatsApp / Phone:\n• +91 85859 37875\n• +91 98717 57937\n• +91 79826 45175\n\n📧 Email:\ninfo@cremsonpublications.com\n\n📍 Address:\n4578/15 (Basement), Aggarwal Road, Darya Ganj, New Delhi – 110002`,
          links: [
            { title: "📞 Call +91 85859 37875", url: "tel:+918585937875" },
            { title: "📞 Call +91 98717 57937", url: "tel:+919871757937" },
            { title: "📞 Call +91 79826 45175", url: "tel:+917982645175" },
            { title: "✉️ Send Email", url: "mailto:info@cremsonpublications.com" },
          ],
          timestamp: getCurrentTime(),
        };
      } else if (/^\d{10}$/.test(cleanText) || lowerText.startsWith("cr") || lowerText.startsWith("spec") || lowerText.startsWith("book")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `📦 Package Search for "${cleanText}"\n\nStatus: 🚚 Order Dispatched / In Transit\nCourier: Shipway Express / DTDC\n\nSign in to view your complete tracking timeline:`,
          links: [
            { title: "🔑 Sign In to View Order Details", url: "/auth/signin?redirect=/my-orders" },
            { title: "🚚 My Orders Page", url: "/my-orders" },
          ],
          timestamp: getCurrentTime(),
        };
      } else {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Thank you for reaching out to Cremson Publications! 📚\n\nHere is our main menu to assist you:`,
          options: INITIAL_BOT_MESSAGE.options,
          timestamp: getCurrentTime(),
        };
      }
    } catch (e) {
      console.error("Widget error:", e);
    } finally {
      setIsTyping(false);
      if (botResponse) {
        setMessages((prev) => [...prev, botResponse]);
      }
    }
  };

  const handleOptionClick = (option) => {
    processUserMessage(option.title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    processUserMessage(text);
  };

  // ─── Double-tick SVG (blue, read receipts) ───────────────────────────────
  const DoubleTick = () => (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" style={{ display: "inline-block" }}>
      <path
        d="M11.071.653a.75.75 0 0 1 1.21.88L6.01 10.1a.75.75 0 0 1-1.114.08L1.4 6.684a.75.75 0 0 1 1.06-1.06l2.9 2.9 5.71-7.87zm2.79 0a.75.75 0 0 1 1.21.88l-6.27 8.567a.75.75 0 0 1-1.114.08L6.5 8.99l1.06-1.062.73.73 5.571-8.005z"
        fill="#53bdeb"
      />
    </svg>
  );

  // ─── External link SVG ────────────────────────────────────────────────────
  const ExternalLinkIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 font-sans print:hidden">
      {/* ═══════════════════════════════════════════
          CHAT WINDOW
      ═══════════════════════════════════════════ */}
      {isOpen && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-xl"
          style={{
            width: "clamp(300px, 90vw, 370px)",
            height: "min(560px, calc(100vh - 170px))",
            boxShadow: "0 12px 50px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.2)",
            animation: "wa-slide-up 0.22s ease-out",
          }}
        >
          {/* ─── HEADER ────────────────────────────────────── */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 flex-shrink-0"
            style={{ backgroundColor: "#128c7e" }}
          >
            {/* Back / close arrow */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 p-1 -ml-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
              >
                {/* Book / publications icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm0 16V14l2.5-1.5L11 14v2h7v4H6z" />
                </svg>
              </div>
              {/* Online indicator */}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ backgroundColor: "#25d366", borderColor: "#128c7e" }}
              />
            </div>

            {/* Name + status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 leading-tight">
                <span className="text-white font-semibold text-[14.5px] truncate">
                  Cremson Publications
                </span>
                {/* Verified badge */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#93c5fd" className="flex-shrink-0">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <p className="text-[11.5px] leading-tight" style={{ color: "rgba(255,255,255,0.75)" }}>
                {isTyping ? "typing..." : "online • official support"}
              </p>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => openExternalWhatsApp()}
                className="p-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Open in WhatsApp App"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* ─── CHAT CANVAS ───────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
            style={{
              backgroundColor: "#eae6df",
              backgroundImage:
                "radial-gradient(circle, #ccc5be 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Date pill */}
            <div className="flex justify-center py-2">
              <span
                className="text-[11px] font-medium px-3 py-1 rounded-md shadow-sm"
                style={{ backgroundColor: "rgba(225,245,254,0.92)", color: "#54656f" }}
              >
                TODAY
              </span>
            </div>

            {/* Messages */}
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col mb-1.5 ${isBot ? "items-start" : "items-end"}`}
                >
                  {/* Bubble wrapper */}
                  <div
                    className="relative max-w-[82%]"
                    style={{ marginLeft: isBot ? "8px" : "0", marginRight: isBot ? "0" : "8px" }}
                  >
                    {/* ── Bubble tail ── */}
                    {isBot ? (
                      /* Left-pointing tail for incoming */
                      <div
                        style={{
                          position: "absolute",
                          top: "0px",
                          left: "-7px",
                          width: 0,
                          height: 0,
                          borderTop: "7px solid transparent",
                          borderRight: "7px solid #ffffff",
                          borderBottom: "7px solid transparent",
                        }}
                      />
                    ) : (
                      /* Right-pointing tail for outgoing */
                      <div
                        style={{
                          position: "absolute",
                          top: "0px",
                          right: "-7px",
                          width: 0,
                          height: 0,
                          borderTop: "7px solid transparent",
                          borderLeft: "7px solid #d9fdd3",
                          borderBottom: "7px solid transparent",
                        }}
                      />
                    )}

                    {/* ── Bubble body ── */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        backgroundColor: isBot ? "#ffffff" : "#d9fdd3",
                        borderRadius: isBot
                          ? "0px 10px 10px 10px"
                          : "10px 0px 10px 10px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
                      }}
                    >
                      {/* Sender name (bot only) */}
                      {isBot && (
                        <div
                          className="px-3 pt-2 pb-0 text-[12px] font-semibold"
                          style={{ color: "#128c7e" }}
                        >
                          Cremson Publications
                        </div>
                      )}

                      {/* Message text */}
                      <div className="px-3 pt-1.5 pb-1">
                        <p
                          className="whitespace-pre-line break-words leading-relaxed"
                          style={{ fontSize: "13.5px", color: "#111b21" }}
                        >
                          {renderMessageText(msg.text)}
                        </p>

                        {/* Timestamp + ticks (shown here when no links) */}
                        {(!msg.links || msg.links.length === 0) && (
                          <div
                            className="flex items-center justify-end gap-1 mt-0.5"
                            style={{ marginBottom: "2px" }}
                          >
                            <span style={{ fontSize: "11px", color: "#667781" }}>
                              {msg.timestamp}
                            </span>
                            {!isBot && <DoubleTick />}
                          </div>
                        )}
                      </div>

                      {/* CTA link buttons (inside bubble, separated by divider) */}
                      {msg.links && msg.links.length > 0 && (
                        <>
                          <div
                            className="flex items-center justify-end px-3 pb-1"
                            style={{ marginTop: "-4px" }}
                          >
                            <span style={{ fontSize: "11px", color: "#667781" }}>
                              {msg.timestamp}
                            </span>
                            {!isBot && (
                              <span className="ml-1">
                                <DoubleTick />
                              </span>
                            )}
                          </div>
                          {msg.links.map((lnk, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleLinkClick(lnk.url)}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 transition-colors cursor-pointer"
                              style={{
                                borderTop: "1px solid #e9edef",
                                fontSize: "13.5px",
                                fontWeight: 500,
                                color: "#027eb5",
                                backgroundColor: "transparent",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <ExternalLinkIcon />
                              {lnk.title}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick-reply option buttons (WhatsApp interactive list style) */}
                  {msg.options && msg.options.length > 0 && (
                    <div
                      className="flex flex-col gap-1 mt-1.5"
                      style={{ width: "82%", marginLeft: isBot ? "8px" : "0" }}
                    >
                      {msg.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionClick(opt)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl cursor-pointer transition-colors"
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e9edef",
                            fontSize: "13.5px",
                            fontWeight: 500,
                            color: "#027eb5",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f9ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
                        >
                          {/* Reply icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                          </svg>
                          {opt.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start mb-1" style={{ marginLeft: "8px" }}>
                <div
                  className="relative"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0px 10px 10px 10px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
                    padding: "10px 14px",
                  }}
                >
                  {/* tail */}
                  <div
                    style={{
                      position: "absolute",
                      top: "0px",
                      left: "-7px",
                      width: 0,
                      height: 0,
                      borderTop: "7px solid transparent",
                      borderRight: "7px solid #ffffff",
                      borderBottom: "7px solid transparent",
                    }}
                  />
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map((delay, i) => (
                      <span
                        key={i}
                        className="rounded-full animate-bounce"
                        style={{
                          width: "7px",
                          height: "7px",
                          backgroundColor: "#8696a0",
                          animationDelay: `${delay}ms`,
                          animationDuration: "1s",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── INPUT BAR ─────────────────────────────────── */}
          <div
            className="flex-shrink-0 px-2 py-2"
            style={{ backgroundColor: "#f0f2f5" }}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              {/* Text input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message"
                className="flex-1 outline-none border-none"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  padding: "9px 16px",
                  fontSize: "14px",
                  color: "#111b21",
                  minHeight: "42px",
                  boxShadow: "none",
                }}
              />

              {/* Send button (always shown) */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex-shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-colors disabled:opacity-40"
                style={{
                  width: "42px",
                  height: "42px",
                  backgroundColor: "#128c7e",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#075e54")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#128c7e")}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: "2px" }}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          FLOATING TOGGLE BUTTON
      ═══════════════════════════════════════════ */}
      <div className="relative group flex justify-end">
        {/* Hover tooltip — only when closed */}
        {!isOpen && (
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 rounded-lg whitespace-nowrap text-white text-xs font-medium shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ backgroundColor: "#111b21" }}
          >
            Chat with us
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className="relative flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ width: "56px", height: "56px" }}
          aria-label={isOpen ? "Close WhatsApp Chat" : "Open WhatsApp Support Chat"}
        >
          {/* Pulse ring (unread, only when closed) */}
          {hasUnread && !isOpen && (
            <span
              className="absolute inset-0 rounded-full animate-ping"
              style={{ backgroundColor: "rgba(37,211,102,0.3)" }}
            />
          )}

          {/* Unread badge (only when closed) */}
          {hasUnread && !isOpen && (
            <span
              className="absolute top-0 right-0 flex items-center justify-center rounded-full text-white font-bold border-2 border-white"
              style={{
                width: "20px",
                height: "20px",
                fontSize: "11px",
                backgroundColor: "#ef4444",
                zIndex: 10,
              }}
            >
              1
            </span>
          )}

          {/* ── When OPEN: show X close icon ── */}
          {isOpen ? (
            <span
              className="flex items-center justify-center rounded-full"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "#25d366",
                boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
              }}
            >
              {/* X icon (Lucide-style inline SVG) */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
          ) : (
            /* ── When CLOSED: show WhatsApp icon ── */
            <img
              src={whatsappIcon.src}
              alt="WhatsApp Support"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))" }}
            />
          )}
        </button>
      </div>


      {/* Slide-up animation keyframes */}
      <style>{`
        @keyframes wa-slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
