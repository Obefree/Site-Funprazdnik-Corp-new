import type { CaseItem } from "@/lib/cases";
import { Tag } from "./Tag";

export function CaseCard({ item }: { item: CaseItem }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-hover">
      <div className="relative h-44 overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-soft via-white to-surface" />
        <div className="absolute inset-0 bg-dot opacity-50" />
        <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <Tag key={t} variant="outline">{t}</Tag>
          ))}
        </div>
        <div className="absolute left-5 bottom-5">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.industry}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
        <p className="mt-2 text-sm text-muted">{item.teamSize}</p>

        <p className="mt-4 text-[15px] leading-relaxed text-ink/80">{item.challenge}</p>

        <div className="mt-auto pt-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Результат</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {item.results.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                <em className="not-italic">{r}</em>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
