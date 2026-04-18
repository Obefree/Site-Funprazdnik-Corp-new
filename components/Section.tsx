import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

type SectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  bleed?: boolean;
  innerClassName?: string;
};

export function Section({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  bleed,
  innerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)} {...props}>
      {bleed ? (
        children
      ) : (
        <Container className={cn(innerClassName)}>
          {(eyebrow || title || description) && (
            <header
              className={cn(
                "mb-10 md:mb-14 max-w-3xl",
                align === "center" && "mx-auto text-center",
              )}
            >
              {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
              {title && (
                <h2 className="text-display-lg font-semibold text-ink">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-5 text-lg leading-relaxed text-muted">
                  {description}
                </p>
              )}
            </header>
          )}
          {children}
        </Container>
      )}
    </section>
  );
}
