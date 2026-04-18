import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "brand" | "outline";
};

export function Tag({ className, variant = "default", ...props }: TagProps) {
  const variants = {
    default: "bg-surface text-muted border border-line",
    brand: "bg-brand-soft text-brand-ink border border-brand/20",
    outline: "bg-white text-ink border border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
