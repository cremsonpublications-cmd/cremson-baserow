"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * options: string[] OR { label: string, value: string }[]
 */
export default function CustomDropdown({ options = [], value, onChange, placeholder = "Select..." }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalised = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const selected = normalised.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-black hover:border-neutral-400 focus:ring-2 focus:ring-black focus:outline-none transition-all"
      >
        <span className={selected ? "text-black" : "text-neutral-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open && (
        <ul
          className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden"
          style={{ maxHeight: 240, overflowY: "auto" }}
        >
          {normalised.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                opt.value === value
                  ? "bg-black text-white font-semibold"
                  : "text-black hover:bg-neutral-100"
              }`}
            >
              {opt.label}
              {opt.value === value && (
                <span className="text-white text-xs">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
