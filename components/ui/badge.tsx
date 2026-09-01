import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ok" | "warn" | "error" | "muted" | "amber";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantMap: Record<string, string> = {
    default:   "border-transparent bg-blue-600 text-white dark:bg-blue-500",
    secondary: "border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    destructive:"border-transparent bg-red-600 text-white dark:bg-red-500",
    outline:   "border-slate-200 text-slate-800 dark:border-slate-700 dark:text-slate-200",
    ok:        "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warn:      "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error:     "border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    muted:     "border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    amber:     "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantMap[variant] ?? variantMap.default,
        className
      )}
      {...props}
    />
  );
}
