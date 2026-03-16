import React from "react";

export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-to-content absolute top-2 left-2 z-50 px-4 py-2 bg-yellow-500 text-black font-bold rounded focus:outline-none focus:ring-2 focus:ring-black transition-transform -translate-y-16 focus:translate-y-0"
      tabIndex={0}
    >
      Ir al contenido principal
    </a>
  );
}
