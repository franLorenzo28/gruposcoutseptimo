import React from "react";

export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content fixed top-3 left-3 z-[60] rounded-md bg-yellow-400 px-4 py-2 font-bold text-black shadow-lg transition-transform -translate-y-20 focus:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
      tabIndex={0}
    >
      Ir al contenido principal
    </a>
  );
}
