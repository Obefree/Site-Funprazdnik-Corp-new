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
        "relative overflow-hidden border-b border-line bg-cream",
        compact ? "pt-14 pb-16 md:pt-20 md:pb-20" : "pt-16 pb-20 md:pt-24 md:pb-28",
        className,
      )}
    >
      {/* Фоновые блики */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-gold/12 blur-[80px]" />
        <div className="absolute bottom-0 -left-20 h-[340px] w-[340px] rounded-full bg-lime/14 blur-[60px]" />
      </div>

      {/* Мицелиевая сеть — полный фон */}
      <MyceliumNetwork
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-brand opacity-[0.11]"
      />

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

function MyceliumNetwork({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 1280 560"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Главные стволы от центрального узла */}
        <path d="M640 280 C600 255 538 228 472 202" strokeWidth="0.9"/>
        <path d="M472 202 C422 182 362 164 295 150" strokeWidth="0.9"/>
        <path d="M640 280 C700 252 764 220 832 190" strokeWidth="0.9"/>
        <path d="M832 190 C886 164 948 142 1015 128" strokeWidth="0.9"/>
        <path d="M640 280 C616 325 588 368 554 406" strokeWidth="0.9"/>
        <path d="M554 406 C528 434 496 460 458 480" strokeWidth="0.9"/>
        <path d="M640 280 C668 324 700 362 736 396" strokeWidth="0.9"/>
        <path d="M736 396 C764 422 796 444 832 460" strokeWidth="0.9"/>
        <path d="M640 280 C636 240 630 196 620 152" strokeWidth="0.9"/>
        <path d="M640 280 C645 320 648 364 646 408" strokeWidth="0.9"/>

        {/* Ветви второго порядка */}
        <path d="M472 202 C462 172 450 140 432 110" strokeWidth="0.65"/>
        <path d="M472 202 C492 215 514 226 538 234" strokeWidth="0.65"/>
        <path d="M295 150 C272 136 246 124 216 115" strokeWidth="0.65"/>
        <path d="M295 150 C285 172 272 194 255 214" strokeWidth="0.65"/>
        <path d="M216 115 C194 104 170 95 143 90" strokeWidth="0.65"/>
        <path d="M1015 128 C1048 112 1084 100 1122 92" strokeWidth="0.65"/>
        <path d="M1015 128 C1008 148 998 168 984 186" strokeWidth="0.65"/>
        <path d="M1122 92 C1148 82 1175 74 1204 70" strokeWidth="0.65"/>
        <path d="M832 190 C838 215 840 242 836 268" strokeWidth="0.65"/>
        <path d="M554 406 C534 418 512 428 488 435" strokeWidth="0.65"/>
        <path d="M458 480 C438 492 415 502 390 508" strokeWidth="0.65"/>
        <path d="M736 396 C730 418 720 440 706 460" strokeWidth="0.65"/>
        <path d="M832 460 C852 472 874 482 898 488" strokeWidth="0.65"/>
        <path d="M620 152 C605 128 587 106 564 88" strokeWidth="0.65"/>
        <path d="M620 152 C640 144 660 138 682 134" strokeWidth="0.65"/>
        <path d="M646 408 C644 432 638 456 628 478" strokeWidth="0.65"/>

        {/* Тонкие нити третьего порядка */}
        <path d="M432 110 C420 90 405 72 386 58" strokeWidth="0.45"/>
        <path d="M432 110 C448 102 466 96 486 92" strokeWidth="0.45"/>
        <path d="M538 234 C548 248 555 264 558 280" strokeWidth="0.45"/>
        <path d="M255 214 C240 228 222 240 202 249" strokeWidth="0.45"/>
        <path d="M143 90 C124 82 102 76 78 74" strokeWidth="0.45"/>
        <path d="M143 90 C138 108 130 126 118 142" strokeWidth="0.45"/>
        <path d="M984 186 C968 200 948 212 925 220" strokeWidth="0.45"/>
        <path d="M836 268 C848 282 857 298 860 316" strokeWidth="0.45"/>
        <path d="M488 435 C472 444 454 450 434 453" strokeWidth="0.45"/>
        <path d="M390 508 C372 513 352 516 330 516" strokeWidth="0.45"/>
        <path d="M706 460 C698 476 686 490 670 500" strokeWidth="0.45"/>
        <path d="M898 488 C918 496 940 500 963 502" strokeWidth="0.45"/>
        <path d="M564 88 C550 70 532 55 510 44" strokeWidth="0.45"/>
        <path d="M682 134 C700 128 720 124 742 122" strokeWidth="0.45"/>
        <path d="M628 478 C620 494 608 508 593 518" strokeWidth="0.45"/>

        {/* Перемычки между ветвями — создают сеть */}
        <path d="M538 234 C572 250 606 264 640 280" strokeWidth="0.4" strokeDasharray="3 4"/>
        <path d="M558 280 C580 282 610 281 640 280" strokeWidth="0.4" strokeDasharray="3 4"/>
        <path d="M860 316 C858 340 848 362 832 380" strokeWidth="0.4" strokeDasharray="3 4"/>
        <path d="M202 249 C220 260 240 268 262 274" strokeWidth="0.4" strokeDasharray="3 4"/>
        <path d="M434 453 C445 466 454 480 460 494" strokeWidth="0.4" strokeDasharray="3 4"/>
        <path d="M742 122 C764 118 785 116 806 118" strokeWidth="0.4" strokeDasharray="3 4"/>
      </g>

      {/* Узлы-споры */}
      <g fill="currentColor">
        <circle cx="640" cy="280" r="3.5"/>
        <circle cx="472" cy="202" r="2.5"/>
        <circle cx="832" cy="190" r="2.5"/>
        <circle cx="554" cy="406" r="2.5"/>
        <circle cx="736" cy="396" r="2.5"/>
        <circle cx="295" cy="150" r="2"/>
        <circle cx="1015" cy="128" r="2"/>
        <circle cx="458" cy="480" r="2"/>
        <circle cx="832" cy="460" r="2"/>
        <circle cx="620" cy="152" r="2"/>
        <circle cx="646" cy="408" r="2"/>
        <circle cx="432" cy="110" r="1.6"/>
        <circle cx="216" cy="115" r="1.6"/>
        <circle cx="1122" cy="92" r="1.6"/>
        <circle cx="984" cy="186" r="1.6"/>
        <circle cx="836" cy="268" r="1.6"/>
        <circle cx="488" cy="435" r="1.6"/>
        <circle cx="706" cy="460" r="1.6"/>
        <circle cx="564" cy="88" r="1.4"/>
        <circle cx="143" cy="90" r="1.4"/>
        <circle cx="390" cy="508" r="1.4"/>
        <circle cx="898" cy="488" r="1.4"/>
        <circle cx="538" cy="234" r="1.4"/>
        <circle cx="682" cy="134" r="1.4"/>
      </g>
    </svg>
  );
}
