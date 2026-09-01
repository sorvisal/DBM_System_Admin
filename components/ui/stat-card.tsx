import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  /** Color class applied to the value text. e.g. "text-green-600 dark:text-green-400" */
  valueColor?: string;
  /** Color class applied to the icon. e.g. "text-blue-500" */
  iconColor?: string;
  /** Show an amber warning ring around the card */
  warning?: boolean;
  /** Extra vertical padding on the card body */
  padded?: boolean;
  /** Override the card root className */
  className?: string;
  /** Override the card body className */
  bodyClassName?: string;
}

/**
 * Reusable summary/statistic card used across all admin pages.
 * Consistent visual design, responsive grid behavior.
 */
export function StatCard({
  label,
  value,
  subtitle,
  icon,
  valueColor,
  iconColor = "text-slate-400 dark:text-slate-500",
  warning,
  padded = true,
  className,
  bodyClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        "dark:border-slate-800 dark:bg-slate-950",
        warning && "ring-1 ring-amber-300 dark:ring-amber-700",
        className,
      )}
    >
      <div
        className={cn(
          padded ? "p-4" : "p-3",
          bodyClassName,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
              {label}
            </p>
            <p
              className={cn(
                "text-2xl font-bold leading-tight truncate",
                valueColor ?? "text-slate-900 dark:text-slate-50",
              )}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
