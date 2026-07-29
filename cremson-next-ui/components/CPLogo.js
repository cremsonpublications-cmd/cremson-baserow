import React from "react";
import logoImg from "../images/CP-Logo.png";

export default function CPLogo({ className = "h-8 md:h-10" }) {
  return (
    <img
      src={logoImg.src}
      alt="Cremson Publications"
      className={`object-contain ${className}`}
    />
  );
}
