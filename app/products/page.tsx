import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { CTABlock } from "@/components/CTABlock";
import { Button, ArrowRight } from "@/components/Button";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: "Продукты",
  description:
    "Четыре продукта: онлайн-корпоратив, гибридный квест, игрофикация мероприятий и долгосрочная программа.",
};

export default function ProductsPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="Продукты"
        title="Форматы под задачу, а не пакеты услуг"
        description="Четыре продукта закрывают основные сценарии: знакомство и сплочение, гибридные команды, внешние мероприятия и работа вдолгую."
        actions={
          <Button href="/contacts" size="lg" className="group">
            Обсудить формат
            <ArrowRight />
          </Button>
        }
      />

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      <CTABlock
        title="Не уверены, какой формат подойдёт?"
        description="Опишите команду и контекст — предложим формат и сценарий под задачу."
        primaryLabel="Назначить встречу"
      />
    </>
  );
}
