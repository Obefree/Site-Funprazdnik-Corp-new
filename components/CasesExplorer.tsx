"use client";

import { useMemo, useState } from "react";
import { cases as allCases, caseTags, type CaseTag } from "@/lib/cases";
import { CaseCard } from "./CaseCard";
import { cn } from "@/lib/cn";

export function CasesExplorer() {
  const [active, setActive] = useState<CaseTag | "all">("all");

  const filtered = useMemo(
    () => (active === "all" ? allCases : allCases.filter((c) => c.tags.includes(active))),
    [active],
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <FilterChip label="Все" active={active === "all"} onClick={() => setActive("all")} />
        {caseTags.map((tag) => (
          <FilterChip
            key={tag}
            label={tag}
            active={active === tag}
            onClick={() => setActive(tag)}
          />
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <CaseCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">
          Для этого фильтра пока нет кейсов. <br />
          <em className="not-italic">Скоро добавим.</em>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ease-out-soft",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink hover:border-brand/40 hover:text-brand",
      )}
    >
      {label}
    </button>
  );
}
