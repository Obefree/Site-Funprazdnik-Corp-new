import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type HeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function Hero({ eyebrow, title, description, actions, aside, className, compact }: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-line bg-white",
        compact ? "pt-14 pb-16 md:pt-20 md:pb-20" : "pt-16 pb-20 md:pt-24 md:pb-28",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-brand-soft blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-dot opacity-30" />
      </div>

      <Container>
        <div className={cn("grid gap-12", aside ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:items-center" : "")}>
          <div className="max-w-3xl">
            {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
            <h1 className="text-display-xl font-semibold text-ink">{title}</h1>
            {description && (
              <p className="mt-6 text-lg leading-relaxed text-muted md:text-xl">
                {description}
              </p>
            )}
            {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
          </div>
          {aside && <div>{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
