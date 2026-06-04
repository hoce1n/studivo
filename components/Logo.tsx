import React from "react";

export function Logo({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* حرف S انتزاعی */}
      <path d="M7 15l10" />
      <path d="M9 15v5" />
      <path d="M15 15v5" />
      <path d="M9 11h6V8H9v3z" className="text-primary fill-primary/10" />
      
      {/* حرف V انتزاعی که به شکل یک صندلی یا میز هم دیده می‌شود */}
      <path d="M12 3v12" />
      <path d="M12 3l3 3" />
      <path d="M12 3l-3 3" />
    </svg>
  );
}

export function LogoAlt({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* فضای سالن */}
      <path d="M3 10V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      
      {/* صندلی یا میز مینیمال */}
      <path d="M7 15h10" />
      <path d="M9 15v5" />
      <path d="M15 15v5" />
      <path d="M12 7v8" />
    </svg>
  );
}