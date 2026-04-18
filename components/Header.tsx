"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNav } from "@/lib/navigation";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/85 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-ink">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Funprazdnik Corp</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href="/contacts" size="md">
            Назначить встречу
          </Button>
        </div>

        <button
          className="lg:hidden h-10 w-10 rounded-xl border border-line bg-white"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Меню</span>
          <svg viewBox="0 0 20 20" className="mx-auto h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            ) : (
              <path d="M4 7h12M4 13h12" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-line/80 bg-white transition-[max-height] duration-300 ease-out-soft",
          open ? "max-h-[420px]" : "max-h-0",
        )}
      >
        <div className="container-site flex flex-col gap-1 py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] text-ink transition-colors hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
          <div className="px-3 py-3">
            <Button href="/contacts" size="md" className="w-full">
              Назначить встречу
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".6" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}
