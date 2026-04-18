import Link from "next/link";
import type { Product } from "@/lib/products";
import { Tag } from "./Tag";
import { ArrowRight } from "./Button";

export function ProductCard({ product, href }: { product: Product; href?: string }) {
  const url = href ?? `/products/${product.slug}`;
  return (
    <Link
      href={url}
      className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-white p-7 shadow-card transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-hover"
    >
      <div>
        <div className="flex items-center justify-between">
          <Tag variant="brand">Продукт</Tag>
          <span className="text-xs text-muted">{product.duration}</span>
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight text-ink">
          {product.title}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{product.tagline}</p>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted">Для кого</dt>
            <dd className="text-ink">{product.audience}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted">Задача</dt>
            <dd className="text-ink">{product.task}</dd>
          </div>
        </dl>

        <ul className="mt-5 flex flex-wrap gap-2">
          {product.metrics.map((m) => (
            <li key={m}>
              <Tag variant="default">
                <em className="not-italic text-ink">{m}</em>
              </Tag>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm font-medium text-brand">
        <span>Обсудить формат</span>
        <ArrowRight />
      </div>
    </Link>
  );
}
