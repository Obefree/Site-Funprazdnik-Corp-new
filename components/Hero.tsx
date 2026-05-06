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
        "relative overflow-hidden border-b border-line bg-white/80",
        compact ? "pt-14 pb-16 md:pt-20 md:pb-20" : "pt-16 pb-20 md:pt-24 md:pb-28",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-brand-soft blur-3xl opacity-80" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[280px] w-[280px] rounded-full bg-emerald-900/15 blur-3xl" />
        <div className="absolute inset-0 mycelium-web opacity-40" />
        <div className="absolute right-[12%] top-[22%] h-14 w-12 rounded-[55%_55%_45%_45%] bg-brand/20" />
        <div className="absolute right-[15%] top-[30%] h-8 w-3 rounded-full bg-brand/15" />
        <div className="absolute left-[8%] bottom-[18%] h-12 w-9 rounded-[55%_55%_45%_45%] bg-emerald-900/15" />
        <div className="absolute left-[10%] bottom-[24%] h-7 w-2.5 rounded-full bg-emerald-900/15" />
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
