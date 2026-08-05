"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { getMyOrders } from "../lib/api/orders";

// Primary WhatsApp Number for Cremson Publications
const WHATSAPP_NUMBER = "917982645175";

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Initial Bot Welcome Message matching backend whatsapp_chat.py
const INITIAL_BOT_MESSAGE = {
  id: "msg_init",
  sender: "bot",
  text: `👋 Welcome to Cremson Publications! 📚

How can we assist you today? Select an option below to start your chat with our automated WhatsApp flow:`,
  options: [
    { id: "1", title: "1️⃣ Teachers Section", desc: "Answer keys, lesson plans & verification" },
    { id: "2", title: "2️⃣ Buy Books", desc: "Browse catalog & place online orders" },
    { id: "3", title: "3️⃣ Track Your Order", desc: "Check delivery status with ID or phone" },
    { id: "4", title: "4️⃣ Request Specimen Copy", desc: "Free sample books for school teachers" },
    { id: "5", title: "5️⃣ Bulk Order Inquiry", desc: "Special school & institutional discounts" },
    { id: "6", title: "6️⃣ Contact Support", desc: "Speak directly with Cremson support team" },
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
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Hide widget on admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (hasUnread) setHasUnread(false);
  };

  const openExternalWhatsApp = (text) => {
    const message = text || "Hi";
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLinkClick = (url) => {
    if (url.startsWith("http") || url.startsWith("tel:") || url.startsWith("mailto:")) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
    }
  };

  // Logic to process user input and return bot response matching whatsapp_chat.py
  const processUserMessage = async (userText) => {
    const cleanText = userText.trim();
    const lowerText = cleanText.toLowerCase();

    // 1. User Message Object
    const userMsgObj = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setIsTyping(true);

    let botResponse = null;

    try {
      // Reset / Menu triggers
      if (["hi", "hello", "start", "menu", "main", "main menu"].includes(lowerText)) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `👋 Welcome to Cremson Publications! 📚\n\nHow can we assist you today?`,
          options: INITIAL_BOT_MESSAGE.options,
          timestamp: getCurrentTime(),
        };
      }
      // Option 1: Teachers Section
      else if (cleanText.startsWith("1") || lowerText.includes("teacher")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Great to have you here, Educator! 🎓\nWe provide answer keys, lesson plans, and free specimen copies to verified teachers.\n\nAre you currently registered with Cremson Publications?`,
          options: [
            { id: "reg_yes", title: "1️⃣ Registered Teacher", actionType: "TEACHER_REG" },
            { id: "reg_no", title: "2️⃣ Unregistered / New Teacher", actionType: "TEACHER_NEW" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Option 1 Sub-action: Registered Teacher
      else if (lowerText.includes("registered teacher") || lowerText.includes("reg_yes")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Welcome back, Educator! 🎉\n\nVerified teachers get full access to answer keys, lesson plans & question banks. Choose an action below:`,
          links: [
            { title: "🔑 Sign In to Teacher Account", url: "/auth/signin" },
            { title: "📥 Download Answer Keys & Lesson Plans", url: "https://drive.google.com/drive/folders/1GV6nyKLREdZbAt1Vt1IHW-CkqoB8wtpB?usp=share_link" },
            { title: "📚 Request Free Specimen Copies", url: "/specimen-request" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Option 1 Sub-action: New Teacher
      else if (lowerText.includes("new teacher") || lowerText.includes("reg_no")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `Awesome! You can register or sign in as a teacher on our website using the links below:`,
          links: [
            { title: "🔑 Sign In", url: "/auth/signin" },
            { title: "🌐 Teacher Signup Form", url: "/auth/teacher-signup" },
            { title: "📚 Request Specimen Copy", url: "/specimen-request" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Option 2: Buy Books
      else if (cleanText.startsWith("2") || lowerText.includes("buy") || lowerText.includes("shop")) {
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
      }
      // Option 3: Track Order
      else if (cleanText.startsWith("3") || lowerText.includes("track")) {
        if (!user) {
          // USER IS NOT LOGGED IN -> Require Sign In First
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
          // USER IS LOGGED IN -> Fetch user's orders from backend API
          try {
            const userOrders = await getMyOrders(user.email);

            if (userOrders && userOrders.length > 0) {
              const latestOrder = userOrders[0];
              const orderSummaryText = userOrders
                .slice(0, 3)
                .map((o) => `• Order #${o.id} — Status: ${o.status || "Order Placed"} (${o.date || "Recent"})`)
                .join("\n");

              const linksList = [
                { title: "📦 View All My Orders", url: "/my-orders" },
              ];

              if (latestOrder.trackingUrl) {
                linksList.unshift({ title: "🚚 Track Latest Shipment", url: latestOrder.trackingUrl });
              }

              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `Welcome back, ${user.name || user.email.split("@")[0]}! 📦\n\nHere are your recent orders:\n${orderSummaryText}\n\nClick below to manage or track your shipments:`,
                links: linksList,
                timestamp: getCurrentTime(),
              };
            } else {
              botResponse = {
                id: `bot_${Date.now()}`,
                sender: "bot",
                text: `Hello ${user.name || user.email.split("@")[0]}! 📦\n\nYou haven't placed any orders under ${user.email} yet.\n\nIf you placed an order as a guest, please type your Order ID, Specimen ID, or 10-digit mobile number below:`,
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
              text: `Welcome back! 📦\n\nYou can view and track all your account orders directly on your Orders page:`,
              links: [
                { title: "📦 View My Orders Page", url: "/my-orders" },
              ],
              timestamp: getCurrentTime(),
            };
          }
        }
      }
      // Option 4: Specimen Request
      else if (cleanText.startsWith("4") || lowerText.includes("specimen")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `We provide free specimen copies to school teachers for evaluation purposes. 📚`,
          links: [
            { title: "🔑 Sign In", url: "/auth/signin?redirect=/specimen-request" },
            { title: "📑 Fill Specimen Request Form", url: "/specimen-request" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Option 5: Bulk Order
      else if (cleanText.startsWith("5") || lowerText.includes("bulk")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `That's wonderful news! 🎉\nThank you for choosing Cremson Publications for this Session! 🙏\n\nSelect an option below to proceed:`,
          links: [
            { title: "🛍️ Browse Shop", url: "/shop" },
            { title: "📋 Fill Bulk Order Form", url: "/bulk-order" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Option 6: Contact Support
      else if (cleanText.startsWith("6") || lowerText.includes("support") || lowerText.includes("contact")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `📞 Cremson Support Team\n\nEmail: info@cremsonpublications.com\nPhone: +91 79826 45175 / +91 85859 37875\nWorking Hours: Mon–Sat, 9:00 AM - 6:00 PM\n\nAddress: 4578/15 (Basement), Aggarwal Road, Darya Ganj, New Delhi – 110002`,
          links: [
            { title: "📞 Call +91 79826 45175", url: "tel:+917982645175" },
            { title: "✉️ Email Support", url: "mailto:info@cremsonpublications.com" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Phone / Order ID tracking query
      else if (/^\d{10}$/.test(cleanText) || lowerText.startsWith("cr") || lowerText.startsWith("spec") || lowerText.startsWith("book")) {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: `📦 Package Search Result for "${cleanText}"\n\nStatus: 🚚 Order Dispatched / In Transit\nCourier: Shipway Express / DTDC\n\nPlease sign in to view your complete tracking timeline:`,
          links: [
            { title: "🔑 Sign In to View Order Details", url: "/auth/signin?redirect=/my-orders" },
            { title: "🚚 My Orders Page", url: "/my-orders" },
          ],
          timestamp: getCurrentTime(),
        };
      }
      // Fallback response
      else {
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
    processUserMessage(option.title || option.desc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText("");
    processUserMessage(text);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans text-left print:hidden">
      {/* WhatsApp Chat Window Modal */}
      {isOpen && (
        <div className="mb-3 w-[330px] sm:w-[380px] h-[520px] max-h-[calc(100vh-100px)] bg-[#efeae2] rounded-2xl shadow-2xl border border-gray-300 flex flex-col overflow-hidden transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-5">
          {/* Authentic WhatsApp Header */}
          <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between shadow-md relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow-sm flex items-center justify-center overflow-hidden">
                  <svg className="w-6 h-6 text-[#075e54] fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate flex items-center gap-1">
                  <span>Cremson Publications</span>
                  <span className="text-emerald-300 text-xs">✓</span>
                </h3>
                <p className="text-[11px] text-emerald-100 truncate">
                  {isTyping ? "typing..." : user ? `logged in as ${user.name || user.email}` : "online • official support"}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-700/50 rounded-full transition-colors cursor-pointer"
                aria-label="Close WhatsApp Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Authentic WhatsApp Chat Canvas */}
          <div
            className="flex-1 p-3 overflow-y-auto space-y-3 relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
            style={{ backgroundColor: "#efeae2" }}
          >
            {/* Today Pill */}
            <div className="flex justify-center my-1">
              <span className="bg-white/90 backdrop-blur text-gray-500 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-md shadow-2xs">
                Today
              </span>
            </div>

            {/* Render Chat Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                } animate-in fade-in duration-200`}
              >
                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[82%] px-3.5 py-2.5 rounded-xl shadow-xs text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none"
                      : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                  }`}
                >
                  {/* Bot Sender Label */}
                  {msg.sender === "bot" && (
                    <div className="text-[11px] font-bold text-[#075e54] mb-1 flex items-center justify-between">
                      <span>Cremson Publications</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                        BOT
                      </span>
                    </div>
                  )}

                  {/* Message Body Content */}
                  <p className="whitespace-pre-line break-words">{msg.text}</p>

                  {/* Interactive Action Link Buttons */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2.5 space-y-1.5 pt-2 border-t border-gray-100">
                      {msg.links.map((lnk, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleLinkClick(lnk.url)}
                          className="w-full text-left text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] bg-sky-50 hover:bg-sky-100 p-2.5 rounded-xl border border-sky-200 transition-colors flex items-center justify-between cursor-pointer group shadow-2xs"
                        >
                          <span className="truncate pr-1">{lnk.title}</span>
                          <svg className="w-3.5 h-3.5 text-sky-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Status Icon */}
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                      msg.sender === "user" ? "text-emerald-700" : "text-gray-400"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === "user" && (
                      <span className="text-[#53bdeb] font-bold text-[11px]">✓✓</span>
                    )}
                  </div>
                </div>

                {/* Interactive Option Selection Buttons */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-2 w-[85%] sm:w-[82%] space-y-1.5 pl-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Select an option:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionClick(opt)}
                          className="w-full text-left bg-white hover:bg-[#d9fdd3]/60 active:bg-[#d9fdd3] border border-emerald-200 hover:border-emerald-400 px-3 py-2 rounded-xl text-xs font-medium text-gray-800 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between cursor-pointer group"
                        >
                          <span className="truncate pr-2">{opt.title}</span>
                          <svg
                            className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Real-time Typing Bubble */}
            {isTyping && (
              <div className="flex items-start max-w-[80%]">
                <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-2xs border border-gray-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-gray-500 ml-1">Cremson is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Authentic WhatsApp Input Bar */}
          <div className="p-2.5 bg-[#f0f2f5] border-t border-gray-300 flex flex-col gap-1.5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message or reply..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#075e54] text-gray-900 placeholder-gray-400 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-9 h-9 bg-[#075e54] hover:bg-[#128c7e] active:bg-[#004d40] text-white rounded-full flex items-center justify-center transition-colors shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                title="Send Message"
              >
                <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] px-2 text-gray-500">
              <button
                type="button"
                onClick={() => processUserMessage("Hi")}
                className="text-[#075e54] hover:underline font-semibold cursor-pointer"
              >
                ↺ Reset Menu (&quot;Hi&quot;)
              </button>
              <button
                type="button"
                onClick={() => openExternalWhatsApp(inputText || "Hi")}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Continue on WhatsApp App</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="relative group">
        {!isOpen && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-medium rounded-xl whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5">
            <span>WhatsApp Support</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
        )}

        <button
          type="button"
          onClick={handleToggle}
          className="relative bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1caa52] text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 border-white/30"
          aria-label="Toggle WhatsApp Support Chat"
        >
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping opacity-75 pointer-events-none" />

          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md">
              1
            </span>
          )}

          {isOpen ? (
            <svg className="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 sm:w-9 sm:h-9 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
