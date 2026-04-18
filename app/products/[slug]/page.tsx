import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { CTABlock } from "@/components/CTABlock";
import { Button, ArrowRight } from "@/components/Button";
import { Tag } from "@/components/Tag";
import { Container } from "@/components/Container";
import { products, getProduct } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProduct(params.slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.tagline,
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const related = products.filter((p) => p.slug !== product.slug);

  return (
    <>
      <Hero
        compact
        eyebrow={`Продукт · ${product.duration}`}
        title={product.title}
        description={product.tagline}
        actions={
          <>
            <Button href="/contacts" size="lg" className="group">
              Обсудить формат
              <ArrowRight />
            </Button>
            <Button href="/products" size="lg" variant="secondary">
              Все продукты
            </Button>
          </>
        }
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <InfoBlock title="Для кого" text={product.audience} />
          <InfoBlock title="Задача" text={product.task} />
          <InfoBlock title="Длительность" text={product.duration} />
        </div>
      </Section>

      <Section
        eyebrow="Как проходит"
        title="Из чего собран формат"
        className="bg-white border-y border-line"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {product.how.map((step, i) => (
            <div key={step} className="card">
              <p className="text-xs font-medium tracking-[0.16em] text-brand">0{i + 1}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink">{step}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Результат" title="Что получает команда и бизнес">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <ul className="space-y-3">
            {product.result.map((r) => (
              <li key={r} className="flex items-start gap-3 rounded-xl border border-line bg-white p-5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                <p className="text-[15px] leading-relaxed text-ink">{r}</p>
              </li>
            ))}
          </ul>
          <div className="card">
            <p className="eyebrow mb-3">Ориентиры</p>
            <ul className="space-y-2">
              {product.metrics.map((m) => (
                <li key={m}>
                  <Tag variant="brand"><em className="not-italic">{m}</em></Tag>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              <em className="not-italic">Значения зависят от контекста команды и формата, уточняем на этапе проработки.</em>
            </p>
            <div className="mt-6 border-t border-line pt-6">
              <p className="eyebrow mb-3">Форматы проведения</p>
              <div className="flex flex-wrap gap-2">
                {product.formats.map((f) => (
                  <Tag key={f}>{f}</Tag>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="Другие продукты"
        title="Могут подойти и эти"
        className="bg-white border-y border-line"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {related.map((p) => (
            <Link
              key={p.slug}
              href={`/products/${p.slug}`}
              className="card card-hover group flex flex-col"
            >
              <h3 className="text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{p.tagline}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                Подробнее <ArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <CTABlock
        title="Обсудим формат под вашу команду"
        description="Короткая встреча — 20–30 минут. После неё будет понимание формата и ориентиров."
        primaryLabel="Назначить встречу"
      />
    </>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <p className="text-xl leading-snug text-ink">{text}</p>
    </div>
  );
}
