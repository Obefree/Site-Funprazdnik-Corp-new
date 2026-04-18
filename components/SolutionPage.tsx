import { Hero } from "./Hero";
import { Section } from "./Section";
import { FeatureCard } from "./FeatureCard";
import { CTABlock } from "./CTABlock";
import { Button, ArrowRight } from "./Button";

export type SolutionPageProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  problems: { title: string; text?: string }[];
  outcomes: { title: string; text?: string }[];
  useCases?: { title: string; text: string }[];
  ctaTitle: string;
  ctaLabel?: string;
};

export function SolutionPage({
  eyebrow,
  title,
  description,
  problems,
  outcomes,
  useCases,
  ctaTitle,
  ctaLabel = "Обсудить задачу",
}: SolutionPageProps) {
  return (
    <>
      <Hero
        eyebrow={eyebrow}
        title={title}
        description={description}
        compact
        actions={
          <>
            <Button href="/contacts" size="lg" className="group">
              {ctaLabel}
              <ArrowRight />
            </Button>
            <Button href="/products" size="lg" variant="secondary">
              Продукты
            </Button>
          </>
        }
      />

      <Section eyebrow="Проблема" title="Что обычно болит">
        <div className="grid gap-3 md:grid-cols-2">
          {problems.map((p) => (
            <FeatureCard key={p.title} title={p.title} description={p.text} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Результат"
        title="Что получаете на выходе"
        className="bg-white border-y border-line"
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((o) => (
            <FeatureCard key={o.title} title={o.title} description={o.text} />
          ))}
        </div>
      </Section>

      {useCases && useCases.length > 0 && (
        <Section eyebrow="Где используется" title="Типичные сценарии">
          <div className="grid gap-4 md:grid-cols-3">
            {useCases.map((u) => (
              <div key={u.title} className="card">
                <h3 className="text-lg font-semibold text-ink">{u.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{u.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <CTABlock
        title={ctaTitle}
        description="Расскажите про команду и задачу — предложим подходящий формат."
        primaryLabel={ctaLabel}
      />
    </>
  );
}
