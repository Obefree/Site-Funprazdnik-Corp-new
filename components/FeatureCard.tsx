import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FeatureCardProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  className?: string;
};

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={cn("card card-hover h-full", className)}>
      {icon && (
        <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
