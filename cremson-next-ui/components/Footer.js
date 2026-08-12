"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";
import logoImg from "../images/CP-Logo.png";
import Link from "next/link";

const AUTH_ROUTES = ["/auth/signin", "/auth/signup", "/auth/verify-email", "/forgot-password", "/my-orders", "/wishlist", "/account", "/cart", "/checkout", "/admin"];

export default function Footer() {
  const pathname = usePathname();
  const { setIsCartOpen, setIsWishlistOpen, setSearchQuery } = useApp();

  const [email, setEmail] = useState("");

  if (AUTH_ROUTES.some((r) => pathname?.startsWith(r))) return null;

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail("");
  };

  return (
    <footer className="mt-10">
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 xl:px-0">
          <div className="grid gap-6 md:gap-12 items-start grid-cols-1 lg:grid-cols-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                  <img className="max-w-[70px] md:max-w-[100px]" src={logoImg.src} alt="Cremson Publications Logo" />
                </h3>
                
                <div className="mb-4 md:mb-6">
                  <div className="flex items-start gap-3 md:gap-4 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-1 flex-shrink-0">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div className="text-left">
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Address:</h4>
                      <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                        4578/15 (Basement), Aggarwal Road,<br />
                        Opp. Happy School, Darya Ganj,<br />
                        New Delhi – 110002
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 md:mb-6 text-left">
                  <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <div>
                      <span className="text-sm md:text-lg font-semibold text-gray-900">Phone: </span>
                      <a href="tel:011-4578594" className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm md:text-base">011-4578594</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:gap-4 mb-2 md:mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-1">
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                      <path d="M12 18h.01"></path>
                    </svg>
                    <div>
                      <span className="text-sm md:text-lg font-semibold text-gray-900 block mb-1">Mobile: </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base">
                        <a href="tel:+917982645175" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">+91 79826 45175</a>
                        <span className="text-gray-300">•</span>
                        <a href="tel:+919871757937" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">+91 98717 57937</a>
                        <span className="text-gray-300">•</span>
                        <a href="tel:+918585937875" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">+91 85859 37875</a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 md:mb-6 text-left">
                  <div className="flex items-center gap-3 md:gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0">
                      <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                    </svg>
                    <div>
                      <span className="text-sm md:text-lg font-semibold text-gray-900">Email: </span>
                      <a href="mailto:info@cremsonpublications.com" className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm md:text-base break-all">info@cremsonpublications.com</a>
                    </div>
                  </div>
                </div>

                <div className="mb-6 md:mb-8 text-left">
                  <div className="flex items-start gap-3 md:gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-5 h-5 md:w-6 md:h-6 text-blue-600 mt-1 flex-shrink-0">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <div>
                      <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">Working Hours:</h4>
                      <p className="text-xs md:text-sm text-gray-700">Monday - Saturday, 09:00 AM - 06:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-[220px] sm:h-[300px] md:h-[500px] relative">
                <iframe title="Cremson Publications Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.674920656613!2d77.243199!3d28.6489313!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfdb930b05529%3A0xc91931c5625f55a3!2sCremson%20Publications%204578%2F15%2C%20Ansari%20Rd%20opp.%20Happy%20School%2C%20Daryaganj%20New%20Delhi%2C%20Delhi%2C%20110002!5e0!3m2!1sen!2sin!4v1750450282497!5m2!1sen!2sin" className="w-full h-full rounded-lg" allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative">
        <div className="absolute bottom-0 w-full h-1/2 bg-[#F0F0F0]"></div>
        <div className="px-4">
          <div className="relative grid grid-cols-1 md:grid-cols-2 py-9 md:py-11 px-6 md:px-16 max-w-7xl mx-auto bg-black rounded-[20px]">
            <p className="font-integralCF font-bold text-xl sm:text-[28px] md:text-[40px] text-white mb-6 md:mb-0 text-left">STAY UP TO DATE ABOUT OUR LATEST OFFERS</p>
            <div className="flex items-center w-full">
              <form onSubmit={handleSubscribe} className="flex flex-col w-full max-w-[349px] mx-auto">
                <div className="input-group focus-within:shadow-lg pl-4 transition-all relative items-center w-full rounded-full overflow-hidden flex bg-white mb-[14px]">
                  <div className="input-group-text mr-3">
                    <img src="/icons/envelope.svg" alt="" className="min-w-5 min-h-5" />
                  </div>
                  <input
                    className="input-control w-full py-3 pr-4 outline-none placeholder:font-normal bg-transparent placeholder:text-black/40 placeholder:text-sm sm:placeholder:text-base text-black"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  className="inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-secondary-foreground shadow-sm hover:bg-secondary/80 text-sm sm:text-base font-medium bg-white h-12 rounded-full px-4 py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  aria-label="Subscribe to Newsletter"
                  type="submit"
                >
                  Subscribe to Newsletter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 md:pt-8 lg:pt-[50px] bg-[#F0F0F0] px-4 pb-2 md:pb-4 text-left">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 mb-6 md:mb-8">
            <div className="flex flex-col lg:col-span-3 lg:max-w-[248px] mb-4 md:mb-0">
              <div className="mb-4">
                <img src={logoImg.src} alt="Cremson Publications" className="max-w-[80px] md:max-w-[120px] mb-3 md:mb-4" />
              </div>
              <p className="text-black/60 text-xs md:text-sm mb-4 md:mb-6">Discover quality educational books and publications that enhance learning and inspire knowledge. From textbooks to reference materials.</p>
              
              <div className="flex items-center">
                <a className="bg-white hover:bg-black hover:text-white transition-all mr-2 md:mr-3 w-6 h-6 md:w-7 md:h-7 rounded-full border border-black/20 flex items-center justify-center p-1" href="https://www.instagram.com/cremsonbooks/?igsh=MTFweXAwYnk3c2wyOQ%3D%3D" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </a>
                <a className="bg-white hover:bg-black hover:text-white transition-all mr-2 md:mr-3 w-6 h-6 md:w-7 md:h-7 rounded-full border border-black/20 flex items-center justify-center p-1" href="https://www.youtube.com/@cremson_publications" target="_blank" rel="noopener noreferrer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                    <path d="m10 15 5-3-5-3z"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="hidden lg:grid col-span-9 lg:grid-cols-4 lg:pl-10">
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">shop</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>all books</Link>
                <button onClick={() => setIsWishlistOpen(true)} className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors text-left">wishlist</button>
                <button onClick={() => setIsCartOpen(true)} className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors text-left">cart</button>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">categories</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>combos</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>lab manual</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>sample papers</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>textbook</Link>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">company</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/contact-us">contact us</Link>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">policies</h3>
                <a className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/terms-conditions" target="_blank" rel="noopener noreferrer">terms &amp; conditions</a>
                <a className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>
              </section>
            </div>

            <div className="grid lg:hidden grid-cols-2 sm:grid-cols-4">
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">shop</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>all books</Link>
                <button onClick={() => setIsWishlistOpen(true)} className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors text-left">wishlist</button>
                <button onClick={() => setIsCartOpen(true)} className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors text-left">cart</button>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">categories</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>combos</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>lab manual</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>sample papers</Link>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/shop" onClick={() => setSearchQuery("")}>textbook</Link>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">company</h3>
                <Link className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/contact-us">contact us</Link>
              </section>
              
              <section className="flex flex-col mt-5">
                <h3 className="font-medium text-sm md:text-base uppercase tracking-widest mb-6">policies</h3>
                <a className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/terms-conditions" target="_blank" rel="noopener noreferrer">terms &amp; conditions</a>
                <a className="text-black/60 text-sm md:text-base mb-4 w-fit capitalize hover:text-black transition-colors" href="/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>
              </section>
            </div>
          </div>

          <hr className="h-[1px] border-t-black/10 mb-3 md:mb-6" />

          <div className="flex flex-col items-center text-center space-y-1 md:space-y-2 mb-1 md:mb-2">
            <p className="text-xs md:text-sm text-black/60">
              Design and developed by <span className="text-red-500 font-medium">Arjunan</span>
            </p>
            <p className="text-xs md:text-sm text-black/60">© 2026 Cremson Publications. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
