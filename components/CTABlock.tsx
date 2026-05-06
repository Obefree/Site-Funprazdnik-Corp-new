import type { ReactNode } from "react";
import { Button, ArrowRight } from "./Button";
import { Container } from "./Container";

type CTABlockProps = {
  title: ReactNode;
  description?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTABlock({
  title,
  description,
  primaryHref = "/contacts",
  primaryLabel = "Назначить встречу",
  secondaryHref,
  secondaryLabel,
}: CTABlockProps) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-[#2b3b2f] via-[#243327] to-[#1f2a21] px-8 py-14 text-white md:px-14 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-24 -right-16 h-[300px] w-[300px] rounded-full bg-brand/35 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-[280px] w-[280px] rounded-full bg-emerald-700/20 blur-3xl" />
            <div className="absolute inset-0 mycelium-web opacity-25" />
          </div>
          <div className="relative max-w-2xl">
            <h2 className="text-display-lg font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-5 text-lg leading-relaxed text-white/75">{description}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={primaryHref} size="lg" variant="invert" className="group">
                {primaryLabel}
                <ArrowRight />
              </Button>
              {secondaryHref && secondaryLabel && (
                <Button href={secondaryHref} size="lg" variant="ghost-invert">
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
