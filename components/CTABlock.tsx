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
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-8 py-14 text-white md:px-14 md:py-20">
          {/* Световые акценты */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 right-10 h-[280px] w-[280px] rounded-full bg-gold/20 blur-[70px]" />
            <div className="absolute bottom-[-40px] left-10 h-[220px] w-[220px] rounded-full bg-lime/15 blur-[60px]" />
          </div>

          {/* Мицелиевая сеть */}
          <CtaMycelium
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full text-lime opacity-[0.12]"
          />

          <div className="relative max-w-2xl">
            <h2 className="text-display-lg font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-5 text-lg leading-relaxed text-white/70">{description}</p>
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

function CtaMycelium({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 900 340"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M820 30 C780 60 736 94 688 124" strokeWidth="0.9"/>
        <path d="M688 124 C652 148 612 170 568 188" strokeWidth="0.9"/>
        <path d="M688 124 C706 138 722 154 734 172" strokeWidth="0.75"/>
        <path d="M568 188 C530 202 488 213 444 220" strokeWidth="0.9"/>
        <path d="M568 188 C562 208 552 226 538 242" strokeWidth="0.75"/>
        <path d="M444 220 C400 225 355 226 310 222" strokeWidth="0.9"/>
        <path d="M444 220 C440 240 432 260 420 278" strokeWidth="0.75"/>
        <path d="M310 222 C270 216 230 206 192 192" strokeWidth="0.9"/>
        <path d="M192 192 C160 178 130 160 104 140" strokeWidth="0.9"/>
        <path d="M104 140 C80 122 58 100 40 76" strokeWidth="0.9"/>
        <path d="M104 140 C96 158 84 175 68 190" strokeWidth="0.75"/>
        <path d="M734 172 C748 192 756 214 756 236" strokeWidth="0.65"/>
        <path d="M538 242 C520 255 500 266 478 274" strokeWidth="0.65"/>
        <path d="M310 222 C304 244 294 265 280 282" strokeWidth="0.65"/>
        <path d="M820 30 C840 48 855 68 864 90" strokeWidth="0.65"/>
        <path d="M864 90 C872 110 874 132 868 154" strokeWidth="0.5"/>
        <path d="M868 154 C858 172 843 188 824 200" strokeWidth="0.5"/>
        <path d="M40 76 C30 56 24 34 22 10" strokeWidth="0.5"/>
        <path d="M68 190 C54 204 38 216 20 225" strokeWidth="0.5"/>
        <path d="M756 236 C758 256 752 276 740 292" strokeWidth="0.45" strokeDasharray="3 4"/>
        <path d="M480 274 C468 284 454 293 438 299" strokeWidth="0.45" strokeDasharray="3 4"/>
        <path d="M280 282 C266 292 250 300 232 305" strokeWidth="0.45" strokeDasharray="3 4"/>
      </g>
      <g fill="currentColor">
        <circle cx="688" cy="124" r="2.5"/>
        <circle cx="568" cy="188" r="2.5"/>
        <circle cx="444" cy="220" r="2.5"/>
        <circle cx="310" cy="222" r="2.5"/>
        <circle cx="192" cy="192" r="2"/>
        <circle cx="104" cy="140" r="2"/>
        <circle cx="734" cy="172" r="1.8"/>
        <circle cx="538" cy="242" r="1.8"/>
        <circle cx="420" cy="278" r="1.8"/>
        <circle cx="864" cy="90" r="1.6"/>
        <circle cx="40" cy="76" r="1.6"/>
      </g>
    </svg>
  );
}
