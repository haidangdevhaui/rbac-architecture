import React from "react";

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
