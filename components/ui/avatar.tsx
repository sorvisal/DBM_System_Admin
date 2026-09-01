import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ src, fallback, className }: { src?: string; fallback: string; className?: string }) {
  const [err, setErr] = React.useState(false);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm flex-shrink-0",
        "dark:bg-blue-500",
        className
      )}
    >
      {!err && src ? (
        <img src={src} alt="" className="w-full h-full rounded-full object-cover" onLoad={() => setErr(false)} onError={() => setErr(true)} />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}
