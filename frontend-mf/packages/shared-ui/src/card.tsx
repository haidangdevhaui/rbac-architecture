import React from "react";

export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
